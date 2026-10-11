/**
 *
 * 数据管理类，负责管理路由组件的数据，
 *
 * 用于在路由切换时自动加载数据，然后传递给路由组件进行渲染。
 *
 */

import type { KylinRouter } from "@/router";
import type { KylinRouterEvents } from "@/types/events";
import { EventEmitter } from "@/utils";

export class Emitter extends EventEmitter<KylinRouterEvents> {}
