export const OPEN_GUIDE_EVENT = 'styleos:open-guide'

export function openStyleOSGuide() {
  window.dispatchEvent(new CustomEvent(OPEN_GUIDE_EVENT))
}
