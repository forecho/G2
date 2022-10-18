type ValueOf<T> = T[keyof T];

type ElementOf<T> = T extends Array<any> ? T[number] : never;

type Chainable<K, V, N> = K extends undefined ? V : N;

export type ValueAttribute<V, N> = <T extends V>(
  value?: T,
) => Chainable<T, V, N>;

export type ObjectAttribute<V, N> = <T extends ValueOf<V>>(
  key: V | keyof V,
  value?: T,
) => Chainable<T, V, N>;

export type ArrayAttribute<V, N> = <T extends V | ElementOf<V>>(
  value?: T,
) => Chainable<T, V, N>;

export type Concrete<T> = { [Key in keyof T]-?: T[Key] };

// Life cycle stage.
export enum CHART_LIFE_CIRCLE {
  BEFORE_RENDER = 'beforerender',
  AFTER_RENDER = 'afterrender',

  BEFORE_PAINT = 'beforepaint',
  AFTER_PAINT = 'afterpaint',

  BEFORE_CHANGE_DATA = 'beforechangedata',
  AFTER_CHANGE_DATA = 'afterchangedata',

  BEFORE_CLEAR = 'beforeclear',
  AFTER_CLEAR = 'afterclear',

  BEFORE_DESTROY = 'beforedestroy',
  AFTER_DESTROY = 'afterdestroy',

  BEFORE_CHANGE_SIZE = 'beforechangesize',
  AFTER_CHANGE_SIZE = 'afterchangesize',
}
