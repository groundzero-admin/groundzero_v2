import { type ElementType, type ComponentPropsWithRef, forwardRef, type ReactNode } from "react";
import { sprinkles, type Sprinkles } from "@/styles/sprinkles.css";

type BoxProps<E extends ElementType = "div"> = Sprinkles &
  Omit<ComponentPropsWithRef<E>, keyof Sprinkles | "as"> & {
    as?: E;
    className?: string;
  };

export const Box = forwardRef(function Box<E extends ElementType = "div">(
  { as, className, ...props }: BoxProps<E>,
  ref: React.Ref<any>
) {
  const Component = as || "div";

  const sprinkleProps: Record<string, unknown> = {};
  const nativeProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (isSprinkleProp(key)) {
      sprinkleProps[key] = value;
    } else {
      nativeProps[key] = value;
    }
  }

  const sprinkleClass = sprinkles(sprinkleProps as Sprinkles);
  const finalClass = [sprinkleClass, className].filter(Boolean).join(" ");

  return <Component ref={ref} className={finalClass} {...nativeProps} />;
}) as <E extends ElementType = "div">(props: BoxProps<E>) => ReactNode;

// Sprinkle keys — used to split props
const SPRINKLE_KEYS = new Set([
  "display", "flexDirection", "alignItems", "justifyContent", "flexWrap",
  "gap", "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "width", "maxWidth", "textAlign", "fontSize", "fontWeight", "lineHeight",
  "color", "backgroundColor", "borderColor", "borderRadius",
  // shorthands
  "px", "py", "mx", "my", "p", "m", "align", "justify", "direction",
  "size", "weight", "leading",
]);

function isSprinkleProp(key: string): boolean {
  return SPRINKLE_KEYS.has(key);
}
