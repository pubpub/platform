import { a as a$1 } from './chunk-5J72HOWM.mjs';
import * as o from 'react';
import * as a from '@radix-ui/react-avatar';
import { jsx } from 'react/jsx-runtime';

var m=o.forwardRef(({className:e,...t},i)=>jsx(a.Root,{ref:i,className:a$1("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",e),...t}));m.displayName=a.Root.displayName;var f=o.forwardRef(({className:e,...t},i)=>jsx(a.Image,{ref:i,className:a$1("aspect-square h-full w-full",e),...t}));f.displayName=a.Image.displayName;var v=o.forwardRef(({className:e,...t},i)=>jsx(a.Fallback,{ref:i,className:a$1("flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800",e),...t}));v.displayName=a.Fallback.displayName;

export { m as Avatar, v as AvatarFallback, f as AvatarImage };
