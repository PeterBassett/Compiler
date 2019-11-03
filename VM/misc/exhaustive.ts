export function exhaustiveCheck(
    check: never,
    throwError: boolean = false
  ): never {
    if (throwError) {
      throw new Error(
        `ERROR! The value ${JSON.stringify(check)} should be of type never.`
      );
    }
    return check;
  }