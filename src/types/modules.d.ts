// These template-ported libraries ship no TypeScript declarations of their own.
declare module "react-modal-video" {
  import type { ComponentType } from "react";
  const ModalVideo: ComponentType<Record<string, unknown>>;
  export default ModalVideo;
}

declare module "react-parallax" {
  import type { ComponentType, CSSProperties, ReactNode } from "react";
  export interface ParallaxProps {
    bgImage?: string;
    bgImageAlt?: string;
    strength?: number;
    bgStyle?: CSSProperties;
    bgImageStyle?: CSSProperties;
    style?: CSSProperties;
    blur?: number | { min: number; max: number };
    children?: ReactNode;
    [key: string]: unknown;
  }
  export const Parallax: ComponentType<ParallaxProps>;
}

declare module "react-18-image-lightbox" {
  import type { ComponentType } from "react";
  export interface LightboxProps {
    mainSrc: string;
    prevSrc?: string;
    nextSrc?: string;
    onCloseRequest: () => void;
    onMovePrevRequest?: () => void;
    onMoveNextRequest?: () => void;
    [key: string]: unknown;
  }
  const Lightbox: ComponentType<LightboxProps>;
  export default Lightbox;
}
