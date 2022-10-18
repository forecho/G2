import { RendererPlugin, Canvas as GCanvas } from '@antv/g';
import { Renderer as CanvasRenderer } from '@antv/g-canvas';
import { Plugin as DragAndDropPlugin } from '@antv/g-plugin-dragndrop';
import { debounce } from '@antv/util';
import { G2Context, render } from '../runtime';
import { ViewComposition } from '../spec';
import { getChartSize } from '../utils/size';
import { Node } from './node';
import {
  defineProps,
  NodePropertyDescriptor,
  nodeProps,
  containerProps,
} from './props';
import {
  ValueAttribute,
  Concrete,
  ArrayAttribute,
  ObjectAttribute,
} from './types';
import { mark, Mark } from './mark';
import { composition, Composition } from './composition';
import { library } from './library';

function normalizeContainer(container: string | HTMLElement): HTMLElement {
  if (container === undefined) return document.createElement('div');
  if (typeof container === 'string') {
    const node = document.getElementById(container);
    return node;
  }
  return container;
}

function removeContainer(container: HTMLElement) {
  const parent = container.parentNode;

  if (parent) {
    parent.removeChild(container);
  }
}

function normalizeRoot(node: Node) {
  if (node.type !== null) return node;
  const root = node.children[node.children.length - 1];
  root.attr('width', node.attr('width'));
  root.attr('height', node.attr('height'));
  root.attr('paddingLeft', node.attr('paddingLeft'));
  root.attr('paddingTop', node.attr('paddingTop'));
  root.attr('paddingBottom', node.attr('paddingBottom'));
  root.attr('paddingRight', node.attr('paddingRight'));
  return root;
}

function valueOf(node: Node): Record<string, any> {
  return {
    ...node.value,
    type: node.type,
  };
}

function Canvas(
  container: HTMLElement,
  width: number,
  height: number,
  renderer = new CanvasRenderer(),
  plugins = [],
) {
  // DragAndDropPlugin is for interaction.
  // It is OK to register more than one time, G will handle this.
  plugins.push(new DragAndDropPlugin());
  plugins.forEach((d) => renderer.registerPlugin(d));
  return new GCanvas({
    container,
    width,
    height,
    renderer,
  });
}

export function initCanvas(
  options: Record<string, any>,
  container: HTMLElement,
) {
  const {
    autoFit = false,
    width: _width = 640,
    height: _height = 480,
    renderer,
    plugins,
  } = options;

  const { width, height } = getChartSize(container, autoFit, _width, _height);

  return Canvas(
    document.createElement('div'),
    width,
    height,
    renderer,
    plugins,
  );
}

export function optionsOf(node: Node): Record<string, any> {
  const root = normalizeRoot(node);
  const discovered: Node[] = [root];
  const nodeValue = new Map<Node, Record<string, any>>();
  nodeValue.set(root, valueOf(root));
  while (discovered.length) {
    const node = discovered.pop();
    const value = nodeValue.get(node);
    for (const child of node.children) {
      const childValue = valueOf(child);
      const { children = [] } = value;
      children.push(childValue);
      discovered.push(child);
      nodeValue.set(child, childValue);
      value.children = children;
    }
  }
  return nodeValue.get(root);
}

export type ChartOptions = ViewComposition & {
  container?: string | HTMLElement;
  width?: number;
  height?: number;
  autoFit?: boolean;
  renderer?: CanvasRenderer;
  plugins?: RendererPlugin[];
};

type ChartProps = Concrete<ViewComposition>;

export interface Chart extends Composition, Mark {
  render(): void;
  node(): HTMLElement;
  data: ValueAttribute<ChartProps['data'], Chart>;
  coordinate: ArrayAttribute<ChartProps['coordinate'], Chart>;
  interaction: ArrayAttribute<ChartProps['interaction'], Chart>;
  key: ValueAttribute<ChartProps['key'], Chart>;
  transform: ArrayAttribute<ChartProps['transform'], Chart>;
  theme: ObjectAttribute<ChartProps['theme'], Chart>;
}

export const props: NodePropertyDescriptor[] = [
  { name: 'data', type: 'value' },
  { name: 'coordinate', type: 'array' },
  { name: 'interaction', type: 'array' },
  { name: 'theme', type: 'object' },
  { name: 'title', type: 'object' },
  { name: 'key', type: 'value' },
  { name: 'transform', type: 'array' },
  { name: 'theme', type: 'object' },
  ...nodeProps(mark),
  ...containerProps(composition),
];

@defineProps(props)
export class Chart extends Node<ChartOptions> {
  private _container: HTMLElement;
  private _context: G2Context;

  constructor(options: ChartOptions = {}) {
    const { container, ...rest } = options;
    super(rest, 'view');
    this._container = normalizeContainer(container);
    this._context = { library };

    // Bind Event for autoFit the chart size.
    this.bindAutoFit();
  }

  render(): Chart {
    const options = this.options();

    if (!this._context.canvas) {
      // Create canvas and library if it do not exist.
      this._context.canvas = initCanvas(options, this._container);
    }

    const node = render(options, this._context);
    if (node.parentNode !== this._container) {
      this._container.append(node);
    }

    return this;
  }

  options() {
    return optionsOf(this);
  }

  node(): HTMLElement {
    return this._container;
  }

  context(): G2Context {
    return this._context;
  }

  destroy() {
    super.destroy();

    this._context.canvas.destroy();
    this.unbindAutoFit();

    removeContainer(this._container);
  }

  clear() {
    this._context.canvas.destroy();
  }

  forceFit(isForce = true) {
    const { width: _width, height: _height } = this.options();
    const { width, height } = getChartSize(
      this._container,
      isForce,
      _width,
      _height,
    );
    this.changeSize(width, height);
  }

  changeSize(width: number, height: number) {
    const { width: _width, height: _height } = this.options();

    if (_width === width && _height === height) {
      return this;
    }

    this._context.canvas.resize(width, height);
    this.render();
  }

  changeData(data: Record<string, any>[]) {
    this.data(data);
    this.render();
  }

  /**
   * When container size changed, change the chart size.
   */
  private onResize = debounce(() => {
    this.forceFit();
  }, 300);

  private bindAutoFit() {
    const { autoFit } = this.options();
    if (autoFit) {
      window.addEventListener('resize', this.onResize);
    }
  }

  private unbindAutoFit() {
    const { autoFit } = this.options();
    if (autoFit) {
      window.removeEventListener('resize', this.onResize);
    }
  }
}
