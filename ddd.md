化化@autospark/router对模态路由的实现，要充分利用autospark本身的x-dialog,x-drawer，x-popover的功能，允许通过路由激活x-dialog,x-drawer，x-popover，但是不进history.
基本路由是这样的：
- x-dialog/x-drawer/x-popover:  在指定令配置中指定options.route=“xxxx”，后，然后在路由表中自动插入一个"!xxxx“的路由项，可以通过
- 在AutoSparkRouter中如果路由项path是以!开头的，则视为模态路由，
                            { path: "!detail", title: "详情", view: "/autospark/router-demos/views/detail.html", modal: ‘diallog’ | 'drawer' | 'popover' },





docker run -d --name robustmq \
  -p 1883:1883 \
  -p 1885:1885 \
  -p 8083:8083 \
  -p 8085:8085 \
  -p 9092:9092 \
  -p 1228:1228 \
  -p 5672:5672 \
  -p 58080:58080 \
  -v /home/testadmin/data/robustmq/server.toml:/robustmq/config/server.toml \
  -v /home/testadmin/data/robustmq:/data \
  ghcr.io/robustmq/robustmq:latest


    