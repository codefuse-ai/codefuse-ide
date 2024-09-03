import React, { useCallback, useEffect, useMemo } from 'react';

import { ChatThinking, ChatThinkingResult } from '@opensumi/ide-ai-native/lib/browser/components/ChatThinking';
import { ChatMarkdown } from '@opensumi/ide-ai-native/lib/browser/components/ChatMarkdown';
import { TSlashCommandCustomRender } from '@opensumi/ide-ai-native/lib/browser/types';
import { useInjectable, COMMON_COMMANDS, CommandService } from '@opensumi/ide-core-browser';
import { Button } from '@opensumi/ide-core-browser/lib/components';
import { CommandOpener } from '@opensumi/ide-core-browser/lib/opener/command-opener';
import { IAIBackServiceResponse, URI } from '@opensumi/ide-core-common';
import { AICommandService, ISumiModelResp, ISumiCommandModelResp, ISumiSettingModelResp } from './command.service';

import styles from './command-render.module.less';

const AiResponseTips = {
  ERROR_RESPONSE: '当前与我互动的人太多，请稍后再试，感谢您的理解与支持',
  STOP_IMMEDIATELY: '我先不想了，有需要可以随时问我',
  NOTFOUND_COMMAND: '很抱歉，暂时未找到可立即执行的命令。',
  NOTFOUND_COMMAND_TIP: '你可以打开命令面板搜索相关操作或者重新提问。'
};

export const CommandRender: TSlashCommandCustomRender = ({ userMessage }) => {
  const aiSumiService = useInjectable<AICommandService>(AICommandService);
  const opener = useInjectable<CommandOpener>(CommandOpener);
  const commandService = useInjectable<CommandService>(CommandService);

  const [loading, setLoading] = React.useState(false);
  const [modelRes, setModelRes] = React.useState<IAIBackServiceResponse<ISumiModelResp>>();

  const userInput = useMemo(() => {
    return userMessage.replace('/IDE', '').trim();
  }, [userMessage]);

  useEffect(() => {
    if (!userInput) {
      return;
    }

    setLoading(true);

    aiSumiService.getModelResp(userInput)
      .then((resp) => {
        setModelRes(resp);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userInput]);

  const excute = useCallback(() => {
    if (modelRes && modelRes.data) {
      if (type === 'command') {
        const modelData = data as ISumiCommandModelResp;
        opener.open(URI.parse(`command:${modelData.commandKey}`));
        return;
      }

      if (type === 'setting') {
        const modelData = data as ISumiSettingModelResp;

        commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id, modelData.settingKey);
      }
    }
  }, [modelRes]);


  const failedText = useMemo(() => {
    if (!modelRes) {
      return '';
    }

    return modelRes.errorCode
      ? AiResponseTips.ERROR_RESPONSE
      : !modelRes.data
        ? AiResponseTips.NOTFOUND_COMMAND
        : '';
  }, [modelRes]);

  const handleRegenerate = useCallback(() => {
    console.log('retry');
  }, []);

  if (loading || !modelRes) {
    return <ChatThinking />;
  }

  if (failedText) {
    return (
      <ChatThinkingResult onRegenerate={handleRegenerate}>
        {failedText === AiResponseTips.NOTFOUND_COMMAND ? (
          <div>
            <p>{failedText}</p>
            <p>{AiResponseTips.NOTFOUND_COMMAND_TIP}</p>
            <Button
              style={{ width: '100%' }}
              onClick={() =>
                opener.open(
                  URI.from({
                    scheme: 'command',
                    path: 'editor.action.quickCommand.withCommand',
                    query: JSON.stringify([userInput]),
                  }),
                )
              }
            >
              打开命令面板
            </Button>
          </div>
        ) : (
          failedText
        )}
      </ChatThinkingResult>
    );
  }

  const { data } = modelRes;
  const { type, answer } = data ?? {};

  return (
    <ChatThinkingResult onRegenerate={handleRegenerate}>
      <div className={styles.chat_excute_result}>
        <ChatMarkdown markdown={answer ?? ''} />
        {type !== 'null' && (
          <Button onClick={excute} style={{ marginTop: '12px' }}>
            {type === 'command' ? '点击执行' : '在设置编辑器中显示'}
          </Button>
        )}
      </div>
    </ChatThinkingResult>
  );
};