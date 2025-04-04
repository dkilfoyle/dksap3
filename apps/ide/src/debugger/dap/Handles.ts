/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class Handles<T> {
  private START_HANDLE = 1000;

  private _nextHandle: number;
  private _handleMap = new Map<number, T>();

  public constructor(startHandle?: number) {
    this._nextHandle = typeof startHandle === "number" ? startHandle : this.START_HANDLE;
  }

  public reset(): void {
    this._nextHandle = this.START_HANDLE;
    this._handleMap = new Map<number, T>();
  }

  public create(value: T): number {
    const handle = this._nextHandle++;
    this._handleMap.set(handle, value);
    return handle;
  }

  public get(handle: number, dflt?: T): T {
    return (this._handleMap.get(handle) || dflt)!;
  }
}
