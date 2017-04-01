// @ flow

export type Vec4 = [number, number, number, number];
export type Mat4 = [Vec4, Vec4, Vec4, Vec4];
export type ProjectionFn = ({viewportWidth: number, viewportHeight:number}) => Mat4;


