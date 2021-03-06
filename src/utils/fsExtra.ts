import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { execCMD } from "./cmd";
import * as vscode from "vscode";

export const mkDirByPathSync = (
  targetDir: string,
  { isRelativeToScript = false } = {}
) => {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = isRelativeToScript ? __dirname : ".";

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && targetDir === curDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
};
export const pullProject = async (gitPath: string, rootPath: string) => {
  try {
    await execCMD(`git clone ${gitPath} ${rootPath}`);
    const rmGit = `rm -rf ${rootPath}/.git`;
    const { stdout, stderr } = await execCMD(rmGit);
    if (stdout || stderr) {
      await vscode.window.showErrorMessage(stdout || stderr);
      return;
    }
  } catch (error) {
    await vscode.window.showErrorMessage(error);
    return;
  }

  await vscode.window.showInformationMessage(
    "Project initialized successfully!"
  );
};
export const writeTpl = util.promisify(fs.writeFile);

export const appendText = util.promisify(fs.appendFile);
