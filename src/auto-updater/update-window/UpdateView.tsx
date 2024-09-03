import { ipcRenderer, shell } from 'electron'
import React, { useEffect, useMemo, useState } from 'react'
import { marked } from '@opensumi/ide-components/lib/utils';
import logo from '@/core/browser/assets/logo.svg'
import styles from './style.module.less'
import { IPC_CHANNEL, ProgressInfo, InitialState, UpdateInfo, UpdateState, EventData } from '../common'

export const UpdateView = () => {
  const [ updateInfo, setUpdateInfo ] = useState<UpdateInfo | null | undefined>()
  const [ progressInfo, setProgressInfo ] = useState<ProgressInfo | null>(null)
  const [ updateState, setUpdateState ] = useState<UpdateState | null>(null)
  const releaseHtml = useMemo(() => {
    const releaseNotes = updateInfo?.releaseNotes
    if (!releaseNotes) return ''
    const releaseNote = Array.isArray(releaseNotes) ? releaseNotes[0]?.note : releaseNotes as string
    return marked(releaseNote || '无更新日志')
  }, [updateInfo])

  const progressPercent = useMemo(() => {
    return (progressInfo?.percent || 0).toFixed(2)
  }, [progressInfo])

  const installApp = async () => {
    setUpdateState(UpdateState.Downloading)
    try {
      await ipcRenderer.invoke(IPC_CHANNEL.downloadAndInstall)
      setUpdateState(UpdateState.Downloaded)
    } catch {
      setUpdateState(UpdateState.DownloadError)
    }
  }

  const ignoreVersion = () => {
    ipcRenderer.send(IPC_CHANNEL.ignoreVersion)
  }

  useEffect(() => {
    ipcRenderer.invoke(IPC_CHANNEL.initialState)
      .then((initialData: InitialState) => {
        setUpdateState(initialData.updateState)
        setProgressInfo(initialData.progressInfo)
        setUpdateInfo(initialData.updateInfo)
      })
      .catch(() => {
        setUpdateInfo(null)
      })

    ipcRenderer.on(IPC_CHANNEL.eventData, (event, data: EventData) => {
      if (data.event === 'download-progress') {
        setProgressInfo(data.data)
      } else if (data.event === 'error') {
        setUpdateState(UpdateState.UpdateError)
      }
    })
  }, [])

  if (typeof updateInfo === 'undefined') return null

  if (updateInfo === null) {
    return (
      <div className={`${styles.container} ${styles.error}`}>
        获取更新信息失败，请稍后重试
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <img src={logo} alt="logo" />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>CodeFuse IDE 有新版本更新</div>
        <div className={styles.subtitle}>CodeFuse IDE {updateInfo.version} 可供下载，您现在的版本是 {process.env.IDE_VERSION}。</div>
        <div className={styles.changelogTitle}>更新日志：</div>
        <div
          className={styles.changelog}
          dangerouslySetInnerHTML={{ __html: releaseHtml }}
          onClickCapture={e => {
            const target = e.target as HTMLAnchorElement;
            if (target && target.tagName === 'A' && target.href) {
              shell.openExternal(target.href);
              e.preventDefault();
            }
          }}
        />
        <div className={styles.footer}>
          <div className={`${styles.progress} ${(updateState === UpdateState.DownloadError || updateState === UpdateState.UpdateError) ? styles.error : ''}`}>
            {updateState === UpdateState.Downloading ? `正在下载更新 (${progressPercent}%) ...` : ''}
            {updateState === UpdateState.Downloaded ? '下载完成，准备重启' : ''}
            {updateState === UpdateState.DownloadError ? '下载失败，请稍后重试' : ''}
            {updateState === UpdateState.UpdateError ? '更新失败，请稍后重试' : ''}
          </div>
          <div className={styles.btn}>
            <button onClick={ignoreVersion}>跳过此版本</button>
            <button className={styles.installBtn} disabled={updateState === UpdateState.Downloading || updateState === UpdateState.Downloaded} onClick={installApp}>安装更新并重启</button>
          </div>
        </div>
      </div>
    </div>
  )
}
