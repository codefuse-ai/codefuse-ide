import {
  CommandService,
  FILE_COMMANDS,
  FileUri,
  IWindowService,
  localize,
  URI,
  useInjectable,
} from "@opensumi/ide-core-browser";
import { IFileServiceClient } from "@opensumi/ide-file-service";
import { IMessageService } from "@opensumi/ide-overlay";
import { posix, win32 } from "@opensumi/ide-utils/lib/path";
import React from "react";

import type { IWelcomeMetaData } from "./common";
import styles from "./welcome.module.less";
import type { ReactEditorComponent } from "@opensumi/ide-editor/lib/browser";

export const EditorWelcomeComponent: ReactEditorComponent<IWelcomeMetaData> = ({
  // eslint-disable-next-line react/prop-types
  resource,
}) => {
  const commandService: CommandService =
    useInjectable<CommandService>(CommandService);
  const windowService: IWindowService =
    useInjectable<IWindowService>(IWindowService);
  const fileService: IFileServiceClient =
    useInjectable<IFileServiceClient>(IFileServiceClient);
  const messageService: IMessageService =
    useInjectable<IMessageService>(IMessageService);

  return (
    <div className={styles.welcome}>
      <div>
        <h2>{localize("welcome.quickStart")}</h2>
        <div>
          <a
            onClick={() => {
              commandService.executeCommand(FILE_COMMANDS.OPEN_FOLDER.id, {
                newWindow: false,
              });
            }}
          >
            {localize("file.open.folder")}
          </a>
        </div>
      </div>
      <div>
        <h2>{localize("welcome.recent.workspace")}</h2>
        {/* eslint-disable-next-line react/prop-types */}
        {resource.metadata?.recentWorkspaces.map((workspace) => {
          let workspacePath = workspace;
          if (workspace.startsWith("file://")) {
            workspacePath = FileUri.fsPath(workspace);
          }
          const p = workspacePath.indexOf("/") !== -1 ? posix : win32;
          let name = p.basename(workspacePath);
          let parentPath = p.dirname(workspacePath);
          if (!name.length) {
            name = parentPath;
            parentPath = "";
          }
          // only the root segment
          return (
            <div key={workspace} className={styles.recentRow}>
              <a
                onClick={async () => {
                  const uri = new URI(workspace);
                  const exist = await fileService.getFileStat(uri.toString());
                  if (exist) {
                    windowService.openWorkspace(uri, { newWindow: false });
                  } else {
                    messageService.error(localize("welcome.workspace.noExist"));
                  }
                }}
              >
                {name}
              </a>
              <span className={styles.path}>{parentPath}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
