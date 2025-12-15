declare module "prompts" {
  type Choice<T = string> = {
    title?: string;
    description?: string;
    value: T;
    disabled?: boolean;
  };

  export type PromptObject<TName extends string = string> = {
    type: string | ((prev: any, values: any, prompt: any) => string);
    name: TName;
    message?: string | ((prev: any, values: any) => string);
    instructions?: string;
    choices?: Array<Choice>;
    [key: string]: unknown;
  };

  export type PromptResult<TName extends string = string> = Record<TName, any>;

  declare function prompts<TName extends string = string>(
    questions: PromptObject<TName> | Array<PromptObject<TName>>,
    options?: {
      onCancel?: () => void;
      onSubmit?: (prompt: PromptObject<TName>, answer: any) => void;
    }
  ): Promise<PromptResult<TName>>;

  export default prompts;
}
