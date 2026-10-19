化化@autospark/router对模态路由的实现，要充分利用autospark本身的x-dialog,x-drawer，x-popover的功能，允许通过路由激活x-dialog,x-drawer，x-popover，但是不进history.
基本路由是这样的：
- x-dialog/x-drawer/x-popover:  在指定令配置中指定options.route=“xxxx”，后，然后在路由表中自动插入一个"!xxxx“的路由项，可以通过
- 在AutoSparkRouter中如果路由项path是以!开头的，则视为模态路由，
                            { path: "!detail", title: "详情", view: "/autospark/router-demos/views/detail.html", modal: ‘diallog’ | 'drawer' | 'popover' },





