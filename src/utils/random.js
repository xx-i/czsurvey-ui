export function randomStr(length = 4) {
  const num = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += num.charAt(Math.floor(Math.random() * num.length));
  }
  return str;
}

export function randomStrArr(strLength, arrSize) {
  const result = [];
  for (let i = 0; i < arrSize; ++i) {
    // result.push()
    do {
      const str = randomStr(strLength);
      if (result.indexOf(strLength) === -1) {
        result.push(str);
        break;
      }
    } while (true);
  }
  return result;
}