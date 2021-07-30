// Type definitions for spectron v17.0.0
// Project: https://github.com/goosewobbler/spectron
// Definitions by: goosewobbler <https://github.com/goosewobbler>

/// <reference types="node" />

import { BasicAppSettings, SpectronApp } from './lib/application';

declare module '@goosewobbler/spectron' {
  export function initSpectron(appSettings: BasicAppSettings): Promise<SpectronApp>;
  export function run(): Promise<void>;
}
