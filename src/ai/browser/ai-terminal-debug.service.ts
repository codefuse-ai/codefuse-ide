import { Autowired, Injectable } from '@opensumi/di';
import { Disposable, URI } from '@opensumi/ide-core-common';
import { IFileServiceClient } from '@opensumi/ide-file-service';
import { IWorkspaceService } from '@opensumi/ide-workspace';

export enum MatcherType {
  base,
  npm,
  typescript,
  node,
  shell,
  java,
}

export interface MatchResult {
  type: MatcherType;
  input?: string;
  errorText: string;
  operate: 'debug' | 'explain';
}

@Injectable()
export class AITerminalDebugService extends Disposable {
  @Autowired(IFileServiceClient)
  private fileServiceClient: IFileServiceClient;

  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService

  private getMessagePrefix(operate: 'debug' | 'explain') {
    return operate === 'debug' ? '分析以下内容' : '解释以下内容';
  }

  public async generatePrompt(result: MatchResult) {
    switch (result.type) {
      case MatcherType.typescript:
        return await this.generateTsPrompt(result);
      case MatcherType.shell:
        return await this.generateShellPrompt(result);
      case MatcherType.java:
        return await this.generateJavaPrompt(result);
      default:
        return this.generateBasePrompt(result);
    }
  }

  public generateBasePrompt(result: MatchResult) {  
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    const prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``;

    return { message, prompt };
  }

  public async generateTsPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    let prompt = '';
    const fileInfo = this.pickFileInfo(result.errorText);

    if (fileInfo?.path && fileInfo?.row && fileInfo?.col) {
      try {
        const codeSnippet = await this.resolveCodeSnippet(fileInfo.path, +fileInfo.row);
        if (codeSnippet) {
          prompt = `
          在 IDE 中进行研发时，终端输出了一些与 typescript 有关的报错信息。
          错误中的代码行内的代码为: \`${codeSnippet.lineCode}\`
          代码行附近的 20 行代码为: \`\`\`\n${codeSnippet.snippet.join('\n')}\n\`\`\`
          错误信息如下: ${result.errorText}
          请给予上面的信息给出解决方案和代码建议
          `;
        }
      } catch {
        prompt = `在 IDE 中进行研发时，终端输出了一些报错信息，其中可能存在多个报错，需要你分别给出每个报错的解决方案，报错信息如下：\`\`\`\n${result.errorText}\n\`\`\``;
      }
    }

    return { message, prompt };
  }

  public pickFileInfo(errorText: string) {
    const fileReg = /(?<path>[\w\/]+\.tsx?):(?<row>\d+):(?<col>\d+)/;

    const match = fileReg.exec(errorText);

    return match ? match.groups as { path: string; row: string; col: string } : undefined;
  }

  public async resolveCodeSnippet(filePath: string, row: number) {
    const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
    if (!workspaceFolderUri) return
    const fileUri = workspaceFolderUri.resolve(filePath);
    const fileContent = await this.fileServiceClient.readFile(fileUri.toString());
    const fileContentLineArray = fileContent.content.toString().split('\n');

    return fileContentLineArray.length ? {
      snippet: fileContentLineArray.slice(Math.max(0, row - 10), row + 10),
      lineCode:  fileContentLineArray[+row - 1]
    } : undefined;
  }

  public async generateShellPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;
    const inputPrompt = `请结合我的输入信息给出具体解决方案:输入信息：${result.input}，`;
    const prompt = `在终端中输入命令遇到了报错，${result.input ? inputPrompt : '请给出可能的解决方案'}，报错信息：\`\`\`\n${result.errorText}\n\`\`\` `;

    return { message, prompt };
  }

  public async generateJavaPrompt(result: MatchResult) {
    const message = `${this.getMessagePrefix(result.operate)}：\`\`\`\n${result.errorText}\`\`\``;

    const errorTextArray = result.errorText.split('\n');
    // 截取 10 行堆栈信息，过多会导致 token 超出上限
    const errorText = errorTextArray.slice(0, 10).join('\n');
    const prompt = `Java应用程序在运行过程中产生了一些报错，请根据报错信息，给出可能的解决方案，报错信息如下：\`\`\`\n${errorText}\n\`\`\` `;

    return { message, prompt };
  }
}