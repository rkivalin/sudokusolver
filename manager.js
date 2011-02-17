
var profiles = [
    {
        title: {en: "Sudoku 9x9", ru: "Судоку 9x9"},
        img: 'sudoku9.svg',
        map: "", s: 9
    }, {
        title: {en: "Sudoku-X", ru: "Судоку-X"},
        img: 'sudoku9x.svg',
        map: "h=3;0,h=4;0,", s: 9
    }, {
        title: {en: "Gattai-2", ru: "Gattai-2"},
        img: 'gattai2.svg',
        map: "0;0,6;6,", s: 9
    }, {
        title: {en: "Sohei", ru: "Sohei"},
        img: 'sohei.svg',
        map: "0;6,6;0,12;6,6;12,", s: 9
    }, {
        title: {en: "Samurai", ru: "Самурай"},
        img: 'samurai.svg',
        map: "0;0,6;6,0;12,12;0,12;12,", s: 9
    }, {
        title: {en: "Sudoku 6x6", ru: "Судоку 6x6"},
        img: 'sudoku6.svg',
        map: "2x3,", s: 6
    }, {
        title: {en: "Sudoku 16x16", ru: "Судоку 16x16"},
        img: 'sudoku-16x16.png',
        map: "4x4,", s: 16
    }, {
        title: {en: "Sudoku 25x25", ru: "Судоку 25x25"},
        img: 'sudoku-16x16.png',
        map: "5x5,", s: 25
    }
];

var s = false; /// Main sudoku
var edata = {url: false, map: false, data: false, txt: "", solution: ""};

var renotify = false;

var notify_node = false;
var notify_text = false;
var notify_timer = false;
function notify(msg) {
}

function notify_close() {
}

function load_sudoku(sudoku) {
    if (location.hash.substr(1).length) {
        renotify = true;
    }
    save_state();
    s.import_txt(sudoku);
}

if (Modernizr.history) {
    window.update_state = function () {
        if (location.hash !== "#" + edata.txt) {
            history.replaceState(void 0, "", "#" + edata.txt);
        }
    };
    window.save_state = function () {
        if ((edata.txt.length || location.hash.length) && location.hash !== "#" + edata.txt) {
            window.hashupdate = true;
        }
        history.pushState(void 0, "", "#" + edata.txt);
    };
} else if (Modernizr.hashchange) {
    window.update_state = function () {
        if ((edata.txt.length || location.hash.length) && location.hash !== "#" + edata.txt) {
            window.hashupdate = true;
            location.replace("#" + edata.txt);
        }
    };
    window.save_state = function () {
        //console.log("[void] save " + edata.txt);
        // add to undo
    };
} else {
    window.update_state = window.save_state = function () {};
}

var undo = [];

$(function () {

    window.hashupdate = false;
    var prop = Modernizr.history ? "onpopstate" : (Modernizr.hashchange ? "onhashchange" : false);
    if (prop !== false) {
        window[prop] = function () {
            if (window.hashupdate) {
                window.hashupdate = false;
                return;
            }
            console.log("load " + location.hash.substr(1));
            s.import_txt(location.hash.substr(1));
            if (renotify) {
                notify(
                    "You can restore your previous sudoku by clicking <a href=\"#\">back</a> in your browser.",
                    function () {
                        history.back();
                        return false;
                    });
                renotify = false;
            }
        };
    }

    /// Sudoku variants

    var html = "";
    for (var i = 0; i < profiles.length; i++) {
        var title = profiles[i].title[lang] || profiles[i].title.en;
        html += "<div id=\"" + i + "\" data-size=\"" + profiles[i].s
            + "\" title=\"" + title + "\"><a href=\"#" + profiles[i].map + "\"><img src=\"./profiles/"
            + profiles[i].img + "\" width=\"100\" height=\"100\"><br />"
            + title + "</a></div>";
    }
    $("#sudokutype").html(html);
    $("#sudokutype a").click(function () { // because some browsers cann't handle history correctly
        if (location.hash === this.href.substr(this.href.indexOf("#"))) {
            return false;
        }
        load_sudoku(this.href.substr(this.href.indexOf("#") + 1));
        return false;
    });

    $(".panel input[type=checkbox] + .elem .label")
        .add(".panel input[type=radio] + .elem .label")
        .click(function () {
            var v = $(this).parent().prev("input");
            if (v.length) {
                v[0].click();
            }
        });

    s = new sudoku($("#sudoku"));

    $("#help-toggle").click(function () {
        $("#help").show();
        return false;
    });
    $("#helpclose").click(function () {
        $("#help").hide();
    });

    $("#left-toggle").click(function () {
        if (this.checked) {
            $("#left").addClass("opened");
            if ($("#left-tabs input:checked").val() === "options" && s.grids.length > 1) {
                s.show_grid_id();
            }
        } else {
            $("#left").removeClass("opened");
            s.hide_grid_id();
        }
    });
    $("#options").add("#sudokutype").css({display: 'none'});
    $("#left-tabs input[name=tab]").click(function () {
        if (this.value === "options") {
            if (s.grids.length > 1) {
                s.show_grid_id();
            }
            $("#sudokutype").add("#custom").css({display: 'none'});
            $("#options").css({display: 'block'});
        } else if (this.value === "custom") {
            s.hide_grid_id();
            $("#sudokutype").add("#options").css({display: 'none'});
            $("#custom").css({display: 'block'});
        } else {
            s.hide_grid_id();
            $("#options").add("#custom").css({display: 'none'});
            $("#sudokutype > div").css({display: 'none'});
            $("#sudokutype > div[data-size=" + parseInt(this.value) + "]").css({display: 'block'});
            $("#sudokutype").css({display: 'block'});
        }
    }).filter(":checked").click();

    notify_node = $("#notify").css({
        width: "200px",
        top: "20px",
        left: "20px"
    });
    notify_text = $("span", notify_node);

    //// Sudoku control

    // Show steps button
    $("#showsteps").click(function () {

    });

    // Clear button
    $("#clear").click(function () {
        if (s.filled === 0) {
            return;
        }
        if (s.ufilled) {
            save_state();
            notify(
                "Sudoku cleared. <a href=\"#\">Cancel.</a>",
                function () {
                    history.back();
                    return false;
                });
        }
        s.clear();
    });

    // Export
    edata.url = $("#export_url")
        .click(function () {
            edata.url = this.checked;
            s.toggle("update");
        }).attr('checked');
    edata.map = $("#export_map")
        .click(function () {
            edata.map = this.checked;
            s.toggle("update");
        }).attr('checked');
    edata.data = $("#export_data")
        .click(function () {
            edata.data = this.checked;
            s.toggle("update");
        }).attr('checked');
    $("#export_txt").add("#solution_txt").click(function () {
        this.selectionStart = 0;
        this.selectionEnd = this.value.length;
    });

    // Toggle guess-and-check button
    $("#gnc-toggle").click(function () {
        s.gnc_toggle();
    });

    // Reset guess-and-check button
    $("#gnc-reset").click(function () {
        s.gnc_reset();
    });

    // Import sudoku
    $("#import").submit(function () {
        load_sudoku($("#import_txt").val());
        $("#import_txt").val("");
        return false;
    });

    /// Tab options

    // Main diagonal switch
    $("#diag_1").click(function () {
        if (!s.agrid) { // no grid selected
            return;
        }
        if (this.checked) {
            s.addhouse(3, s.agrid);
        } else {
            s.delhouse(3, s.agrid);
        }
    });

    // Anti-diagonal switch
    $("#diag_2").click(function () {
        if (!s.agrid) { // no grid selected
            return;
        }
        if (this.checked) {
            s.addhouse(4, s.agrid);
        } else {
            s.delhouse(4, s.agrid);
        }
    });
    // Windoku switch
    $("#windoku").click(function () {
        if (!s.agrid) { // no grid selected
            return;
        }
        if (this.checked) {
            s.addhouse(5, s.agrid, 1);
            s.addhouse(5, s.agrid, 2);
            s.addhouse(5, s.agrid, 3);
            s.addhouse(5, s.agrid, 4);
        } else {
            s.delhouse(5, s.agrid, 1);
            s.delhouse(5, s.agrid, 2);
            s.delhouse(5, s.agrid, 3);
            s.delhouse(5, s.agrid, 4);
        }
    });

    $("#left").add("#panel").add("#panel .ddnode").css({display: "block"});

    //// Sudoku events

    s.bind('update', function (s) { // optimizeable
        $("#stats .labeltext")
            .html("Filled: " + s.filled + "/" + s.total + " &mdash; " + Math.floor(100 * s.filled / s.total) + "&nbsp;%");
        $("#stats .ddnode")
            .html(
                "<p>Givens: " + s.ufilled + "/" + s.total + " &mdash; " + Math.floor(100 * s.ufilled / s.total) + "&nbsp;%</p>" +
                (s.state ? "<p class=\"errors\">there are errors</p>" : "")
            );
        if (s.state) {
            $("#stats").addClass("red");
        } else {
            $("#stats").removeClass("red");
        }
        var e = s.export_all();
        edata.txt = e.map + e.data;
        edata.solution = e.map + e.solution;
        localStorage.restore = edata.txt;
        update_state();
        var pre = (edata.url ? location.protocol + "//" + location.hostname + location.pathname + "#" : "")
            + (edata.map ? e.map : "");
        $("#export_txt").val(pre + (edata.data ? e.data : ""));
        $("#solution_txt").val(pre + (edata.data ? e.solution : ""));
    }).bind('load', function (s) {
        var html = "";
        if (s.grids.length > 1) {
            var html = "Configure grid: ";
            for (var i = 0; i < s.grids.length; i++) {
                html += '<label><input type="radio" id="selectgrid' + i
                    + '" name="selectgrid" value="' + i + '"'
                    + (s.grids[i] === s.agrid ? ' checked' : '')
                    + ' />' + (1+i) + '</label>&ensp;';
            }
        }
        $("#selectgrid").html(html);
        $("#diag_1")
            .attr("disabled", !s.agrid)
            .attr("checked", !!(s.agrid && s.gethouse(3, s.agrid)));
        $("#diag_2")
            .attr("disabled", !s.agrid)
            .attr("checked", !!(s.agrid && s.gethouse(4, s.agrid)));
        $("#selectgrid input[name=selectgrid]").click(function () { s.select_grid(this.value); });
        if ($("#left").hasClass("opened") && $("#left-tabs input:checked").val() === "options" && s.grids.length > 1) {
            s.show_grid_id();
        }
    }).bind('select_grid', function (s) {
        $("#diag_1")
            .attr("disabled", !s.agrid)
            .attr("checked", !!(s.agrid && s.gethouse(3, s.agrid)));
        $("#diag_2")
            .attr("disabled", !s.agrid)
            .attr("checked", !!(s.agrid && s.gethouse(4, s.agrid)));
        if (s.agrid) {
            $("#selectgrid" + s.agrid.id).attr("checked", true);
        }
    }).bind('gnc_state', function (s) {
        $("#gnc-toggle").html(s.gnc ? "&#9724; Stop" : "&#9656; Start");
    });

    /// Initialize sudoku

    if (location.hash.length > 1) {
        s.import_txt(location.hash.substr(1));
        var l = localStorage.restore, h = location.hash.substr(1), s1 = "", s2;
        if (l !== h) {
            s1 = " or <a href=\"#\">load from storage</a>";
            s2 = function () {
                load_sudoku(localStorage.restore);
            };
        }
        notify(
            "Loading sudoku from URL. (<a href=\"#\">Load empty sudoku</a>" + s1 + ")",
            function () {
                load_sudoku("");
            },
            s2);
    }
    else if (localStorage.restore) {
        s.import_txt(localStorage.restore);
        notify(
            "Loading sudoku from storage. (<a href=\"#\">Load default sudoku</a>)",
            function () {
                load_sudoku("");
            });
    }
    else s.import_txt("");

    // keyboard shortcuts
    $(document).keydown(function (e) {
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) switch (e.which) {
            case 27: // Esc
                break;
            case 192: // `
                /*console_toggle();*/
                break;
        }
        if (e.ctrlKey && !e.altKey && !e.shiftKey) switch (e.which) {
            case 13: // Ctrl+Enter
                if (e.target && e.target.form) $(e.target.form).submit();
                break;
            case 37: // Ctrl+←
                var url = $('link[rel=prev]').attr('href');
                if (url) location.href = url;
                break;
            case 38: // Ctrl+↑
                var url = $('link[rel=index]').attr('href');
                if (url) location.href = url;
                break;
            case 39: // Ctrl+→
                var url = $('link[rel=next]').attr('href');
                if (url) location.href = url;
                break;
        }
        if (e.ctrlKey && !e.altKey && e.shiftKey) switch (e.which) {
            case 69: // Ctrl+Shift+E
                break;
            case 88: // Ctrl+Shift+X
                break;
        }
        the = e;
    });

    $("#loadscreen").css({display: "none"});
});
