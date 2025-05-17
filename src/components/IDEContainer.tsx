import React, { useEffect, useRef, useState } from 'react';

// 定义消息类型
interface IDEMessage {
  type: 'copy' | 'paste';
}

interface IDEResponse {
  type: 'copiedText' | 'pastedText';
  data: string;
}

const IDEContainer: React.FC = () => {
  // 创建 iframe 引用
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // 存储复制和粘贴的内容
  const [copiedText, setCopiedText] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');

  // 监听来自 IDE 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 确保消息来自 IDE
      if (event.origin !== window.location.origin) return;

      const message = event.data as IDEResponse;
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'copiedText':
          setCopiedText(message.data);
          console.log('Copied text:', message.data);
          break;
        case 'pastedText':
          setPastedText(message.data);
          console.log('Pasted text:', message.data);
          break;
      }
    };

    // 添加消息监听器
    window.addEventListener('message', handleMessage);

    // 清理函数
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 向 IDE 发送消息的函数
  const sendMessageToIDE = (message: IDEMessage) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, window.location.origin);
    }
  };

  // 复制选中的文本
  const copySelectedText = () => {
    sendMessageToIDE({ type: 'copy' });
  };

  // 粘贴文本
  const pasteText = () => {
    sendMessageToIDE({ type: 'paste' });
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {/* 使用相对路径加载 IDE */}
      <iframe
        ref={iframeRef}
        src="/ide"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="CodeFuse IDE"
      />
      {/* 添加复制粘贴按钮 */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={copySelectedText}>
          复制选中文本
        </button>
        <button onClick={pasteText}>
          粘贴文本
        </button>
      </div>
      {/* 显示复制和粘贴的内容 */}
      <div style={{ position: 'fixed', bottom: '80px', right: '20px', background: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <div>复制的文本: {copiedText}</div>
        <div>粘贴的文本: {pastedText}</div>
      </div>
    </div>
  );
};

export default IDEContainer; 