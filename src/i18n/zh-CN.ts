export const localizationBundle = {
  languageId: 'zh-CN',
  languageName: 'Chinese',
  localizedLanguageName: '中文(中国)',
  contents: {
    'common.about': '关于',
    'common.preferences': '首选项',
    'common.newWindow': '新建窗口',
    'common.newWindowDesc': '打开新的窗口',

    'custom.quick_open': '转到文件',
    'custom.command_palette': '显示所有命令',
    'custom.terminal_panel': '切换终端',
    'custom.search_panel': '切换搜索面板',

    'preference.ai.model.title': '补全模型配置',
    'preference.ai.model.baseUrl': 'API URL 前缀',
    'preference.ai.model.apiKey': 'API Key',
    'preference.ai.model.code': '代码 > 补全',
    'preference.ai.model.code.modelName': '代码 > 模型名称',
    'preference.ai.model.code.systemPrompt': '代码 > 系统提示词',
    'preference.ai.model.code.temperature': '代码 > temperature',
    'preference.ai.model.code.maxTokens': '代码 > max_tokens',
    'preference.ai.model.code.presencePenalty': '代码 > presence_penalty',
    'preference.ai.model.code.frequencyPenalty': '代码 > frequency_penalty',
    'preference.ai.model.code.topP': '代码 > top_p',
    'preference.ai.model.code.modelName.tooltip': '默认和对话模型一致',
    'preference.ai.model.code.fimTemplate': 'FIM 模版',
    'preference.ai.model.code.fimTemplate.tooltip': '如果未提供模版, 则将光标前后代码直接发送到接口, 如果提供了模版, 配置如下格式：“<fim_prefix>{prefix}<fim_suffix>{suffix}<fim_middle>”，{prefix} 会替换为光标前代码，{suffix} 会替换为光标后代码',
    'preference.ai.model.temperature.description': '采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使其更加集中性和确定性。\n通常建议只改变 top_p 或 temperature，不要两个都改',
    'preference.ai.model.maxTokens.description': '补全完成时可以生成的最大 token 数。',
    'preference.ai.model.presencePenalty.description': '存在惩罚，介于 -2.0 和 2.0 之间的数字。正值会根据新生成的词汇是否出现在目前的文本中来进行惩罚，从而增加模型讨论新话题的可能性。',
    'preference.ai.model.frequencyPenalty.description': '频率惩罚，介于 -2.0 和 2.0 之间的数字。正值根据新标记到目前为止在文本中的现有频率对其进行惩罚，从而降低了模型逐字重复同一行的可能性。',
    'preference.ai.model.topP.description': '温度采样的一种替代方法，称为原子核抽样，模型只会考虑前 top_p 概率质量的标记结果。因此，0.1 表示仅考虑前 10% 概率质量的标记。\n通常建议只改变 top_p 或 temperature，不要两个都改',

    'ai.model.noConfig': '为了更好的体验，请先配置 AI 模型服务',
    'ai.model.go': '前往',

    'autoUpdater.checkForUpdates': '检查更新',
    'codefuse-ide.openLogDir': '打开日志文件夹',
  },
};
