interface Size {
  width: number;
  height: number;
}

/**
 * @description Get the element's bounding size.
 * @param container dom element.
 * @returns the element width and height
 */
export function getContainerSize(container: HTMLElement): Size {
  const style = getComputedStyle(container);

  return {
    width:
      (container.clientWidth || parseInt(style.width, 10)) -
      parseInt(style.paddingLeft, 10) -
      parseInt(style.paddingRight, 10),
    height:
      (container.clientHeight || parseInt(style.height, 10)) -
      parseInt(style.paddingTop, 10) -
      parseInt(style.paddingBottom, 10),
  };
}

/**
 *
 * @description Calculate the chart size.
 * @param container DOM container element.
 * @param autoFit Should auto fit.
 * @param width Chart width which is set by user.
 * @param height Chart height which is set by user.
 * @returns chart width and height.
 */
export function getChartSize(
  container: HTMLElement,
  autoFit: boolean,
  width: number,
  height: number,
): Size {
  let w = width;
  let h = height;

  if (autoFit) {
    const size = getContainerSize(container);

    w = size.width ? size.width : w;
    h = size.height ? size.height : h;
  }

  return {
    width: w,
    height: h,
  };
}
