import { launcher as chromedriverLauncher } from 'wdio-chromedriver-service';
import ElectronWorkerService from './service';

export default ElectronWorkerService;
export const launcher = chromedriverLauncher;
