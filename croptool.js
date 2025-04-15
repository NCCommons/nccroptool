"use strict";
angular
    .module("croptool", ["LocalStorageModule", "ngSanitize", "ui.bootstrap", "angular-ladda", "pascalprecht.translate"])
    .config([
        "$translateProvider",
        function(r) {
            r.useSanitizeValueStrategy("escapeParameters"), r.useStaticFilesLoader({
                prefix: "locale/",
                suffix: ".json"
            }), r.preferredLanguage("en");
        },
    ])
    .service("LoginService", [
        "$http",
        "$rootScope",
        function(r, t) {
            var a = this;
            (this.checkLogin = function(r) {
                var e = r.data;
                e.user ? (a.user = {
                        name: e.user
                    }) : (a.user = void 0),
                    (a.loginResponse = e),
                    "object" != typeof a.loginResponse && (a.loginResponse = {
                        error: "The CropTool backend is currently having problems."
                    }),
                    (a.loginResponse.code = r.status),
                    t.$broadcast("loginStatusChanged", a.loginResponse);
            }),
            r.get("./api/auth/user").then(this.checkLogin, this.checkLogin);
        },
    ])
    .service("WindowService", [
        "$rootScope",
        "$window",
        function(r, e) {
            var t = e.outerWidth;
            angular.element(e).bind("resize", function() {
                r.$broadcast("windowWidthChanged", {
                    oldValue: t,
                    value: e.outerWidth
                }), (t = e.outerWidth), r.$apply();
            });
        },
    ])
    .controller("LoginCtrl", [
        "$scope",
        "$http",
        "$httpParamSerializer",
        "LoginService",
        function(e, r, t, a) {
            (e.user = a.user),
            (e.ready = !1),
            (e.oauthLogin = function() {
                window.location.href = "./api/auth/login?" + t(e.currentUrlParams);
            }),
            (e.logout = function() {
                r.get("./api/auth/logout").then(function(r) {
                    a.checkLogin(r.data), (e.user = a.user);
                });
            }),
            e.$on("loginStatusChanged", function() {
                var r;
                (e.user = a.user),
                (e.ready = !0),
                a.loginResponse.error && ((r = 401 == a.loginResponse.code ? null : a.loginResponse.code + " " + a.loginResponse.error), (e.oauthError = r)),
                    (e.oauthWarnings = a.loginResponse.warnings);
            });
        },
    ])
    .directive("ctCropper", [
        "$timeout",
        function(i) {
            return {
                scope: {
                    onCrop: "&",
                    aspectRatio: "@",
                    rotation: "@"
                },
                link: function(a, r) {
                    function e() {
                        o(),
                            Object.defineProperty(r[0], "naturalWidth", {
                                value: r[0].getAttribute("width")
                            }),
                            Object.defineProperty(r[0], "naturalHeight", {
                                value: r[0].getAttribute("height")
                            }),
                            (a.cropper = new Cropper(r[0], {
                                aspectRatio: a.aspectRatio,
                                crop: t,
                                viewMode: 2
                            }));
                    }

                    function t(r) {
                        angular.isFunction(a.onCrop) &&
                            a.$applyAsync(function() {
                                a.onCrop({
                                    $event: r
                                });
                            });
                    }

                    function o() {
                        a.cropper && a.cropper.destroy();
                    }
                    r.on("load", function() {
                            i(e);
                        }),
                        r.bind("$destroy", o),
                        a.$watch("aspectRatio", function(r) {
                            a.cropper && a.cropper.setAspectRatio(r);
                        }),
                        a.$watch("rotation", function(r) {
                            {
                                var e;
                                a.cropper &&
                                    (a.cropper.rotateTo(r),
                                        (r = a.cropper.getImageData()),
                                        (e = a.cropper.getCanvasData()),
                                        (r = Math.min(r.width / e.width, r.height / e.height)),
                                        a.cropper.zoomTo(r),
                                        (e = a.cropper.getData()),
                                        a.cropper.setData(e));
                            }
                        }),
                        a.$on("crop-input-changed", function(r, e) {
                            {
                                var t;
                                e && "object" == typeof e && (((t = a.cropper.getData()).x = e.left), (t.y = e.top), (t.width = e.width), (t.height = e.height), a.cropper.setData(t));
                            }
                        });
                },
            };
        },
    ])
    .controller("AppCtrl", [
        "$scope",
        "$http",
        "$timeout",
        "$q",
        "$window",
        "$httpParamSerializer",
        "LoginService",
        "localStorageService",
        "WindowService",
        function(o, e, r, i, t, n, a, c, l) {
            var s,
                p = !1,
                u = [1, 1],
                d = !1;

            function g(r, e) {
                r = r.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                r = new RegExp("[\\?&]" + r + "=([^&#]*)").exec(e || location.search);
                return null == r ? "" : decodeURIComponent(r[1].replace(/\+/g, " "));
            }

            function m() {
                var r = 0;
                if ("keep" == o.aspectratio) o.metadata && o.metadata.original && (r = o.metadata.original.width / o.metadata.original.height);
                else if ("fixed" == o.aspectratio) {
                    var e = parseInt(o.aspectratio_cx),
                        t = parseInt(o.aspectratio_cy);
                    if (!e || e < 0 || !t || t < 0) return;
                    r = o.aspectratio_cx / o.aspectratio_cy;
                }
                return r;
            }

            function h(r) {
                var e = r.title.match(/([a-z0-9.\-]+)\.(wikimedia.org|wikipedia.org|wmflabs.org|wikisource.org)\/wiki\/([^?]+)/),
                    t = r.title.match(/([a-z0-9.\-]+)\.(wikimedia.org|wikipedia.org|wmflabs.org|wikisource.org)\/w\/index.php/),
                    a = "?" + r.title.split("?")[1];
                e
                    ?
                    ((r.site = e[1] + "." + e[2]), (r.title = e[3]), (r.page = g("page", a) || r.page)) :
                    t ?
                    ((r.site = t[1] + "." + t[2]), (r.title = g("title", a)), (r.page = g("page", a))) :
                    ((r.site = r.site || "commons.wikimedia.org"), (r.page = g("page", a) || r.page));
                try {
                    r.title = decodeURIComponent(r.title);
                } catch (r) {}
                return (r.title = r.title.replace(/_/g, " ").replace(/^[^:]+:/, "")), r.title.match(/\.(pdf|djvu|tiff?)$/) && !r.page && (r.page = 1), r;
            }

            function w(t, a) {
                s && (s.resolve ? s.resolve() : r.cancel(s)),
                    (s =
                        "" == a ?
                        null :
                        r(function() {
                            (s = i.defer()),
                            e.get("./api/file/exists?" + n({
                                site: t,
                                title: a
                            }), {
                                timeout: s.promise
                            }).then(function(r) {
                                var r = r.data,
                                    e = t + ":" + a;
                                (o.error = r.error), r.error ? (o.error = r.error) : (o.exists[e] = r.exists), (s = null);
                            });
                        }, 300));
            }
            (o.currentUrlParams = {}),
            (o.updateCoords = function(r) {
                var e, t;
                d
                    ?
                    (d = !1) :
                    ((e = [Math.round(r.width * u[0]), Math.round(r.height * u[1])]),
                        (t = [Math.round(r.x * u[0]), Math.round(r.y * u[1])]),
                        o.metadata && (o.crop_dim = {
                            x: t[0],
                            y: t[1],
                            w: e[0],
                            h: e[1],
                            right: o.metadata.original.width - t[0] - e[0],
                            bottom: o.metadata.original.height - t[1] - e[1],
                            rotate: r.rotate
                        }));
            }),
            (o.showNotice = !c.get("croptool-notice-4")),
            (o.dismissNotice = function() {
                c.add("croptool-notice-4", "hide"), (o.showNotice = !1);
            }),
            (o.back = function() {
                (o.cropresults = void 0), (o.error = "");
            }),
            (o.pageChanged = function() {
                o.openFile();
            }),
            (o.onCropDimChange = function(r) {
                var e = m();
                0 != e && ("w" == r ? (o.crop_dim.h = Math.round(o.crop_dim.w / e)) : "h" == r && (o.crop_dim.w = Math.round(o.crop_dim.h / e))),
                    void 0 !== o.crop_dim.x &&
                    void 0 !== o.crop_dim.y &&
                    void 0 !== o.crop_dim.w &&
                    void 0 !== o.crop_dim.h &&
                    ((d = !0), o.$broadcast("crop-input-changed", {
                        left: o.crop_dim.x / u[0],
                        top: o.crop_dim.y / u[1],
                        width: o.crop_dim.w / u[0],
                        height: o.crop_dim.h / u[1]
                    }));
            }),
            o.$on("loginStatusChanged", function() {
                    a.user, (o.status = ""), (o.user = a.user);
                }),
                (o.locateBorder = function() {
                    o.borderLocatorBusy ||
                        ((o.borderLocatorBusy = !0),
                            e.get("./api/file/autodetect?" + n({
                                title: o.currentUrlParams.title,
                                site: o.currentUrlParams.site,
                                page: o.currentUrlParams.page
                            })).then(
                                function(r) {
                                    (r = r.data), (o.borderLocatorBusy = !1), console.log(r), (r = r.area);
                                    o.$broadcast("crop-input-changed", {
                                        left: r[0] / u[0],
                                        top: r[1] / u[1],
                                        width: (r[2] - r[0]) / u[0],
                                        height: (r[3] - r[1]) / u[1]
                                    });
                                },
                                function(r) {
                                    (o.error = "An error occurred: " + r.status + " " + r.data.error), (o.borderLocatorBusy = !1);
                                }
                            ));
                }),
                (o.cropMethodChanged = function() {
                    for (c.set("croptool-cropmethod", o.cropmethod); o.rotation.angle < 0;) o.rotation.angle += 360;
                    o.rotation.angle = 90 * Math.round(o.rotation.angle / 90);
                }),
                (o.aspectRatioChanged = function() {
                    var r = m();
                    null !== r && ((o.aspectratio_cxy = r), c.set("croptool-aspectratio", o.aspectratio), c.set("croptool-aspectratio-x", o.aspectratio_cx), c.set("croptool-aspectratio-y", o.aspectratio_cy));
                }),
                (o.openFile = function(r) {
                    if (
                        (!1 === r &&
                            (o.currentUrlParams = {
                                site: g("site"),
                                title: g("title"),
                                page: g("page"),
                                left: g("left"),
                                top: g("top"),
                                right: g("right"),
                                bottom: g("bottom"),
                                width: g("width"),
                                height: g("height"),
                                ratio: g("ratio")
                            }),
                            !1 !== r && ((r = n(o.currentUrlParams)), (r = location.href.split("?", 1)[0] + (r.length ? "?" + r : "")), window.history.pushState(null, null, r), (p = !0)),
                            (o.error = ""),
                            (o.newTitle = ""),
                            (o.cropresults = null),
                            (o.uploadresults = null),
                            !o.currentUrlParams.title)
                    )
                        return (o.metadata = null), void(o.currentUrlParams = {});
                    (o.currentUrlParams = h(o.currentUrlParams)),
                    o.currentUrlParams.page && (o.overwrite = "rename"),
                        o.currentUrlParams.title &&
                        ((o.error = ""),
                            (o.busy = !0),
                            (o.crop_dim = void 0),
                            (o.rotation = {
                                angle: 0
                            }),
                            e.get("./api/file/info?" + n({
                                title: o.currentUrlParams.title,
                                site: o.currentUrlParams.site,
                                page: o.currentUrlParams.page
                            })).then(
                                function(r) {
                                    o.busy = !1;
                                    var e = r.data;
                                    if (e.error) return (o.error = e.error), void(o.metadata = null);
                                    (o.metadata = e),
                                    ("" === o.currentUrlParams.left && "" === o.currentUrlParams.right && "" === o.currentUrlParams.ratio) ||
                                    setTimeout(function() {
                                            var r = {
                                                x: 0,
                                                y: 0,
                                                w: 100,
                                                h: 100
                                            };
                                            "" !== o.currentUrlParams.left && "" !== o.currentUrlParams.right ?
                                                ((r.x = +o.currentUrlParams.left), (r.w = +e.original.width - o.currentUrlParams.right - o.currentUrlParams.left)) :
                                                "" !== o.currentUrlParams.left ?
                                                ((r.x = +o.currentUrlParams.left), (r.w = +o.currentUrlParams.width)) :
                                                "" !== o.currentUrlParams.right && ((r.x = +e.original.width - o.currentUrlParams.right - o.currentUrlParams.width), (r.w = +o.currentUrlParams.width)),
                                                "" !== o.currentUrlParams.top && "" !== o.currentUrlParams.bottom ?
                                                ((r.y = +o.currentUrlParams.top), (r.h = +e.original.height - o.currentUrlParams.bottom - o.currentUrlParams.top)) :
                                                "" !== o.currentUrlParams.top ?
                                                ((r.y = +o.currentUrlParams.top), (r.h = +o.currentUrlParams.height)) :
                                                "" !== o.currentUrlParams.bottom && ((r.y = +e.original.height - o.currentUrlParams.bottom - o.currentUrlParams.top), (r.h = +o.currentUrlParams.height)),
                                                (o.crop_dim = r),
                                                "" !== o.currentUrlParams.ratio && 2 == o.currentUrlParams.ratio.split(":").length ?
                                                ((r = o.currentUrlParams.ratio.split(":")), (o.aspectratio = "fixed"), (o.aspectratio_cx = r[0]), (o.aspectratio_cy = r[1])) :
                                                (o.aspectratio = o.currentUrlParams.ratio || "free"),
                                                o.onCropDimChange(),
                                                o.aspectRatioChanged();
                                        }, 300),
                                        o.aspectRatioChanged(),
                                        (o.availablePages = []);
                                    for (var t = 1; t <= o.metadata.pagecount; t++) o.availablePages.push(t);
                                    (u = o.metadata.thumb ? [o.metadata.original.width / o.metadata.thumb.width, o.metadata.original.height / o.metadata.thumb.height] : [1, 1]),
                                    e.error ||
                                        ((r = o.currentUrlParams.title.lastIndexOf(".")),
                                            o.currentUrlParams.page && 1 < o.metadata.pagecount ?
                                            (o.newTitle = o.currentUrlParams.title.substr(0, r) + " (page " + o.currentUrlParams.page + " crop).jpg") :
                                            (o.newTitle = o.currentUrlParams.title.substr(0, r) + " (cropped)" + o.currentUrlParams.title.substr(r)));
                                },
                                function(r) {
                                    (o.metadata = null), (o.error = r.data.error), (o.busy = !1);
                                }
                            ));
                }),
                (o.preview = function() {
                    if (void 0 === o.crop_dim) return alert("Please select a crop region then press submit."), !1;
                    (o.error = ""),
                    (o.allowIgnoreWarnings = !1),
                    (o.ignoreWarnings = !1),
                    (o.confirmOverwrite = !1),
                    (o.ladda = !0),
                    e
                        .get(
                            "./api/file/crop?" +
                            n({
                                title: o.currentUrlParams.title,
                                site: o.currentUrlParams.site,
                                page: o.currentUrlParams.page,
                                method: o.cropmethod,
                                x: o.crop_dim.x,
                                y: o.crop_dim.y,
                                rotate: o.crop_dim.rotate,
                                width: o.crop_dim.w,
                                height: o.crop_dim.h,
                            })
                        )
                        .then(
                            function(r) {
                                var e,
                                    r = r.data;
                                (o.ladda = !1),
                                (r.page.hasAssessmentTemplates || r.page.hasDoNotCropTemplate) && (o.overwrite = "rename"),
                                (o.cropresults = r).page.elems.wikidata &&
                                    ((e = r.page.elems["wikidata-item"]),
                                        (r = r.wikidata.labels.en),
                                        (o.cropresults.wikidataLink = r ?
                                            '<a target="_blank" href="https://www.wikidata.org/wiki/' + e + '">' + r + " (" + e + ")</a>" :
                                            '<a target="_blank" href="https://www.wikidata.org/wiki/' + e + '">' + e + "</a>"),
                                        (o.overwrite = "rename")),
                                    o.updateUploadComment();
                            },
                            function(r) {
                                (o.error = "[Error] " + r.data.error), (o.ladda = !1);
                            }
                        );
                }),
                (o.upload = function(t) {
                    (o.ladda2 = !0), (o.error = ""), (o.allowIgnoreWarnings = !1);
                    var r = {
                        title: o.currentUrlParams.title,
                        site: o.currentUrlParams.site,
                        page: o.currentUrlParams.page,
                        overwrite: o.overwrite,
                        comment: o.uploadComment,
                        filename: o.newTitle,
                        elems: o.cropresults.page.elems,
                        store: !0,
                    };
                    (o.ignoreWarnings || o.confirmOverwrite) && (r.ignorewarnings = "1"),
                    e.post("./api/file/publish", r).then(
                        function(r) {
                            var e,
                                r = r.data;
                            (o.ladda2 = !1),
                            "Success" === r.result ?
                                (o.uploadresults = r) :
                                "Warning" == r.result ?
                                ((e = Object.keys(r.warnings)),
                                    (o.allowIgnoreWarnings = -1 == e.indexOf("exists") && -1 == e.indexOf("page-exists")),
                                    1 == e.length && "was-deleted" == e[0] ? t || ((o.ignoreWarnings = !0), o.upload(!0)) : (o.error = "Upload failed because of the following warning(s): " + e.join(", ") + ".")) :
                                ((o.error = "Upload failed! "), r.error && (o.error += r.error.info));
                        },
                        function(r) {
                            (o.ladda2 = !1), (o.error = "Upload failed! " + r.data.error);
                        }
                    );
                }),
                angular.element(t).bind("popstate", function(r) {
                    p &&
                        o.$apply(function() {
                            o.openFile(!1);
                        });
                }),
                o.openFile(!1),
                (o.status = "Checking login"),
                (o.cropmethod = c.get("croptool-cropmethod") || "precise"),
                (o.aspectratio = c.get("croptool-aspectratio") || "free"),
                (o.aspectratio_cx = c.get("croptool-aspectratio-x") || "16"),
                (o.aspectratio_cy = c.get("croptool-aspectratio-y") || "9"),
                (o.overwrite = c.get("croptool-overwrite") || "overwrite"),
                (o.rotation = {
                    angle: 0
                }),
                o.aspectRatioChanged(),
                (o.exists = []),
                o.$watch("titleInput", function() {
                    var r, e;
                    o.titleInput && ((e = (r = h({
                        title: o.titleInput
                    })).site + ":" + r.title), r.title && void 0 === o.exists[e] && o.title !== r.title && ((o.error = ""), w(r.site, r.title)), (o.currentUrlParams = r));
                }),
                (o.updateUploadComment = function() {
                    console.log("UPDATE UPLOAD COMM", o.cropresults.page.elems), c.set("croptool-overwrite", o.overwrite);
                    var r = "";
                    "rename" == o.overwrite ? (r += "[[:File:" + o.currentUrlParams.title + "]] cropped") : (r += "Cropped"),
                        (r += " " + o.cropresults.dim),
                        o.cropresults.page.elems.border && (r += " Removed border."),
                        o.cropresults.page.elems.trimming && (r += " Image was trimmed."),
                        o.cropresults.page.elems.watermark && (r += " Removed watermark."),
                        o.cropresults.page.elems.wikidata && (r += " Crop for [[:wikidata:" + o.cropresults.page.elems["wikidata-item"] + "|Wikidata]]."),
                        (o.uploadComment = r);
                }),
                o.$watch("newTitle", function() {
                    o.newTitle && void 0 === o.exists[o.currentUrlParams.site + ":" + o.newTitle] && w(o.currentUrlParams.site, o.newTitle);
                }),
                o.$on("windowWidthChanged", function(r, e) {});
        },
    ]);
