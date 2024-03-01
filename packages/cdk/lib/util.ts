// コンテキストをチェックする用の関数
export const errorMessageForStringContext = (key: string) => {
  return `${key} の設定でエラーになりました。原因として考えられるものは以下です。
  - cdk.json の変更ではなく、-c オプションで設定しようとしている
  - cdk.json に string ではない値を設定している (例: ダブルクォートで囲っていない)
  - cdk.json に項目がない (未設定)`;
};

export const errorMessageForNumberContext = (key: string) => {
  return `${key} の設定でエラーになりました。原因として考えられるものは以下です。
  - cdk.json の変更ではなく、-c オプションで設定しようとしている
  - cdk.json に number ではない値を設定している (例: ダブルクォートで囲っている)
  - cdk.json に項目がない (未設定)`;
};

export const errorMessageForBooleanContext = (key: string) => {
  return `${key} の設定でエラーになりました。原因として考えられるものは以下です。
  - cdk.json の変更ではなく、-c オプションで設定しようとしている
  - cdk.json に boolean ではない値を設定している (例: "true" ダブルクォートは不要)
  - cdk.json に項目がない (未設定)`;
};

export const errorMessageForStringArrayContext = (key: string) => {
  return `${key} の設定でエラーになりました。原因として考えられるものは以下です。
  - cdk.json の変更ではなく、-c オプションで設定しようとしている 
  - cdk.json に string の配列ではない値を設定している (例: []で囲っていない、各要素をダブルクォートで囲っていない)
  - cdk.json に項目がない (未設定)`;
};

export const checkStringContext = (key: string, value: any) => {
  if (value === null || typeof value !== 'string') {
    throw new Error(errorMessageForStringContext(key));
  }
  return value as string;
};

export const checkNumberContext = (key: string, value: any) => {
  if (value === null || typeof value !== 'number') {
    throw new Error(errorMessageForNumberContext(key));
  }
  return value as number;
};

export const checkStringArrayContext = (key: string, value: any) => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(errorMessageForStringArrayContext(key));
  }
  return value as string[];
};

export const checkBooleanContext = (key: string, value: any) => {
  if (value === null || typeof value !== 'boolean') {
    throw new Error(errorMessageForBooleanContext(key));
  }
  return value as boolean;
};
