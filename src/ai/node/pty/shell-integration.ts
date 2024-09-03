import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

const shellIntegrationDirPath = path.join(os.homedir(), process.env.IDE_DATA_FOLDER_NAME!, 'shell-integration');

export const bashIntegrationPath = path.join(shellIntegrationDirPath, 'bash-integration.bash');

/**
  注入的 bash initfile，用于 ShellIntergration 功能的搭建
  后续会针对 ShellIntergation 做整体的架构设计，目前满足基础功能需求
 */
export const bashIntegrationContent = String.raw`

if [ -r /etc/profile ]; then
    . /etc/profile
fi
if [ -r ~/.bashrc ]; then
    . ~/.bashrc
fi
if [ -r ~/.bash_profile ]; then
    . ~/.bash_profile
elif [ -r ~/.bash_login ]; then
    . ~/.bash_login
elif [ -r ~/.profile ]; then
    . ~/.profile
fi

__is_prompt_start() {
	builtin printf '\e]6973;PS\a'
}

__is_prompt_end() {
	builtin printf '\e]6973;PE\a'
}

__is_update_prompt() {
	if [[ "$__is_custom_PS1" == "" || "$__is_custom_PS1" != "$PS1" ]]; then
        __is_original_PS1=$PS1
        __is_custom_PS1="\[$(__is_prompt_start)\]$__is_original_PS1\[$(__is_prompt_end)\]"
        export PS1="$__is_custom_PS1"
    fi
}

__is_update_prompt
`;

export const initShellIntegrationFile = async () => {
  await fs.mkdir(shellIntegrationDirPath, { recursive: true });
  await fs.writeFile(bashIntegrationPath, bashIntegrationContent);
};
