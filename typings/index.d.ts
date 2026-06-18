/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo: Record<string, unknown> | null
    isLoggedIn: boolean
  }
  setUserInfo(userInfo: Record<string, unknown>): void
  clearUserInfo(): void
}
