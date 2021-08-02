import { Element } from 'webdriverio';
import { SpectronApp, DomObject } from '~/common/types';

const isInTheDocument = async (element: Element<'async'>, app: SpectronApp): Promise<boolean> => {
  if (!element) {
    return false;
  }
  const result = await app.webContents.executeJavaScript(
    `(() => { 
        const el = document.querySelector("${element.selector.toString()}");
        return el.ownerDocument.contains(el);
    })();`,
  );
  return !!result;
};

const isVisible = async (element: Element<'async'>, app: SpectronApp): Promise<boolean> => {
  if (!element) {
    return false;
  }
  const result = await app.webContents.executeJavaScript(
    `(() => { 
    const isStyleVisible(element) => {
        const { getComputedStyle } = element.ownerDocument.defaultView;
        const { display, visibility, opacity } = getComputedStyle(element);
        return (
            display !== 'none' &&
            visibility !== 'hidden' &&
            visibility !== 'collapse' &&
            opacity !== '0' &&
            opacity !== 0
        );
    };
  
    const isAttributeVisible = (element, previousElement) => (
        !element.hasAttribute('hidden') &&
        (element.nodeName === 'DETAILS' && previousElement.nodeName !== 'SUMMARY'
            ? element.hasAttribute('open')
            : true)
        );
  
    const isElementVisible = (element, previousElement) => (
        isStyleVisible(element) &&
        isAttributeVisible(element, previousElement) &&
        (!element.parentElement || isElementVisible(element.parentElement, element))
        );

          const el = document.querySelector("${element.selector.toString()}");
          const isInDocument = el.ownerDocument === el.getRootNode({composed: true});
          return isInDocument && isElementVisible(el);
      })();`,
  );
  return !!result;
};

export const initDom = (app: SpectronApp): DomObject => ({
  isInTheDocument: (element: Element<'async'>) => isInTheDocument(element, app),
  isVisible: (element: Element<'async'>) => isVisible(element, app),
});
