import argon2 from "argon2";

//Option
const ARGON2_OPTION: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
};

//Hash
export async function encode(data: string): Promise<string> {
  return await argon2.hash(data, ARGON2_OPTION);
}

//verify
export async function verify(data: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, data);
  } catch {
    return false;
  }
}
