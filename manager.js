
var profiles = [
    {
        title: {en: "Sudoku 9x9", ru: "Судоку 9x9"},
        img: 'sudoku9.svg',
        map: "", s: 9
    }, {
        title: {en: "Sudoku-X", ru: "Судоку-X"},
        img: 'sudoku9x.svg',
        map: "h=diag1:A1,h=diag2:A9", s: 9
    }, {
        title: {en: "Gattai-2", ru: "Gattai-2"},
        img: 'gattai2.svg',
        map: "0:0,6:6", s: 9
    }, {
        title: {en: "Sohei", ru: "Sohei"},
        img: 'sohei.svg',
        map: "0:6,6:0,12:6,6:12", s: 9
    }, {
        title: {en: "Samurai", ru: "Самурай"},
        img: 'samurai.svg',
        map: "0:0,6:6,0:12,12:0,12:12", s: 9
    }, {
        title: {en: "Sudoku 6x6", ru: "Судоку 6x6"},
        img: 'sudoku6.svg',
        map: "3x2", s: 6
    }, {
        title: {en: "Sudoku 16x16", ru: "Судоку 16x16"},
        img: 'sudoku-16x16.png',
        map: "4x4", s: 16
    }, {
        title: {en: "Sudoku 25x25", ru: "Судоку 25x25"},
        img: 'sudoku-16x16.png',
        map: "5x5", s: 25
    }
];

var s = false; /// Main sudoku

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
    save_state(location.hash.substr(1));
    s.load(sudoku);
}

if (Modernizr.history) {
    window.update_state = function (state) {
        if (location.hash !== "#" + state) {
            history.replaceState(void 0, "", "#" + state);
        }
    };
    window.save_state = function (state) {
        if ((state.length || location.hash.length) && location.hash !== "#" + state) {
            window.hashupdate = true;
        }
        history.pushState(void 0, "", "#" + state);
    };
} else if (Modernizr.hashchange) {
    window.update_state = function (state) {
        if ((state.length || location.hash.length) && location.hash !== "#" + state) {
            window.hashupdate = true;
            location.replace("#" + state);
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
            s.load(location.hash.substr(1));
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

    var newSudokuOpened = false;
    var openNewSudoku = function () {
        closeSolvingTechniques();
        $("#sudokuVariationsSwitch").addClass("active");
        $("#sudokuVariations").show();
        newSudokuOpened = true;
        if ($("#left-tabs input:checked").val() === "options" && s.grids.length > 1) {
            renderer.showGridId();
        }
    };
    var closeNewSudoku = function () {
        $("#sudokuVariationsSwitch").removeClass("active");
        $("#sudokuVariations").hide();
        newSudokuOpened = false;
        renderer.hideGridId();
    };
    var toggleNewSudoku = function () {
        if (newSudokuOpened) {
            closeNewSudoku();
        } else {
            openNewSudoku();
        }
    };

    var solvingTechniquesOpened = false;
    var openSolvingTechniques = function () {
        closeNewSudoku();
        $("#solvingTechniquesSwitch").addClass("active");
        $("#solvingTechniques").show();
        solvingTechniquesOpened = true;
    };
    var closeSolvingTechniques = function () {
        $("#solvingTechniquesSwitch").removeClass("active");
        $("#solvingTechniques").hide();
        solvingTechniquesOpened = false;
    };
    var toggleSolvingTechniques = function () {
        if (solvingTechniquesOpened) {
            closeSolvingTechniques();
        } else {
            openSolvingTechniques();
        }
    };

    $("#sudokuVariationsSwitch").click(function () {
        toggleNewSudoku();
        return false;
    });

    $("#solvingTechniquesSwitch").click(function () {
        toggleSolvingTechniques();
        return false;
    });

    /// Sudoku variants

    var html = "";
    for (var i = 0; i < profiles.length; i++) {
        var title = profiles[i].title[lang] || profiles[i].title.en;
        html += "<div id=\"" + i + "\" data-size=\"" + (profiles[i].s == 9 ? profiles[i].s : "other")
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
        closeNewSudoku();
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

    s = new SudokuGrid();
    renderer = new SudokuRenderer({grid: s, node: $("#sudoku"), interactive: true, keyboard: true});
    solver = new SudokuSolver({grid: s, solve: true, gncSpeed: 100});

    $("#helpToggle").click(function () {
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
                renderer.showGridId();
            }
        } else {
            $("#left").removeClass("opened");
            renderer.hideGridId();
        }
    });
    $("#options").add("#sudokutype").css({display: 'none'});
    $("#left-tabs input[name=tab]").click(function () {
        if (this.value === "options") {
            if (s.grids.length > 1) {
                renderer.showGridId();
            }
            $("#sudokutype").add("#custom").css({display: 'none'});
            $("#options").css({display: 'block'});
        } else if (this.value === "custom") {
            renderer.hideGridId();
            $("#sudokutype").add("#options").css({display: 'none'});
            $("#custom").css({display: 'block'});
        } else {
            renderer.hideGridId();
            $("#options").add("#custom").css({display: 'none'});
            $("#sudokutype > div").css({display: 'none'});
            $("#sudokutype > div[data-size=" + this.value + "]").css({display: 'block'});
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

    // Clear button
    $("#clear").click(function () {
        if (s.filled === 0) {
            return;
        }
        if (s.ufilled) {
            save_state(location.hash.substr(1));
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
    $("#export_txt").add("#solution_txt").click(function () {
        this.selectionStart = 0;
        this.selectionEnd = this.value.length;
    });

    // Toggle guess-and-check button
    $("#gncToggle").click(function () {
        solver.gncToggle();
    });

    // Reset guess-and-check button
    $("#gncReset").click(function () {
        solver.gncReset();
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
        if (!renderer.agrid) { // no grid selected
            return;
        }
        if (this.checked) {
            s.addHouse('diag1', renderer.agrid.pos);
        } else {
            s.delHouse('diag1', renderer.agrid.pos);
        }
    });

    // Anti-diagonal switch
    $("#diag_2").click(function () {
        if (!renderer.agrid) { // no grid selected
            return;
        }
        if (this.checked) {
            s.addHouse('diag2', renderer.agrid.pos.step(0, s.s - 1));
        } else {
            s.delHouse('diag2', renderer.agrid.pos.step(0, s.s - 1));
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

    var msgs = {};
    var errCells = {};
    var eProc = function (cell, action, obj) {
        if (action === 'error') {
            errCells[cell.id] = true;
        } else {
            delete errCells[cell.id];
        }
        cell = null;
        for (var i in errCells) {
            cell = s.getCellByAddr(i);
            break;
        }
        if (msgs.error != null) {
            obj.removeMessage(msgs.error);
            delete msgs.error;
        }
        if (cell != null) {
            var e;
            if (cell.digit) {
                e = "Duplicate digit in the house: " + cell.id;
            } else {
                e = "Cann't set any digit in the cell " + cell.id;
            }
            msgs.error = obj.message(e + " &mdash; try to undo your last action (Ctrl+Z)");
        }
    };

    s.on('error', function (cell) { eProc(cell, 'error', this); })
    .on('fix', function (cell) { eProc(cell, 'fix', this); })
    .on('change', function () {
        if (!this.errors && this.filled === this.total) {
            if (msgs.complete == null) {
                msgs.complete = this.message("Congratulations! Sudoku solved.");
            }
        } else if (msgs.complete != null) {
            this.removeMessage(msgs.complete);
            delete msgs.complete;
        }
        $("#stats .labeltext")
            .html("Filled: " + this.filled + "/" + this.total + " &mdash; " + Math.floor(100 * this.filled / this.total) + "&nbsp;%");
        $("#stats .ddnode")
            .html(
                "<p>Givens: " + this.ufilled + "/" + this.total + " &mdash; " + Math.floor(100 * this.ufilled / this.total) + "&nbsp;%</p>" +
                (this.errors ? "<p class=\"errors\">there are errors</p>" : "")
            );
        if (this.errors) {
            $("#stats").addClass("red");
        } else {
            $("#stats").removeClass("red");
        }
        var map = this.saveMap();
        var data = this.saveData();
        var all = map + (map.length && data.length ? ',' : '') + data
        localStorage.restore = all;
        update_state(all);
        var url = location.protocol + "//" + location.hostname + location.pathname + "#" + all;
        $("#export_txt").val(url);
        //$("#solution_txt").val(url);
    }).on('loadMap', function () {
        var html = "", t = this;
        if (this.grids.length > 1) {
            var html = "Configure grid: ";
            for (var i = 0; i < this.grids.length; i++) {
                html += '<label><input type="radio" id="selectgrid' + i
                    + '" name="selectgrid" value="' + i + '"'
                    + (this.grids[i] === renderer.agrid ? ' checked' : '')
                    + ' />' + (1+i) + '</label>&ensp;';
            }
        }
        $("#selectgrid").html(html);
        $("#diag_1")
            .attr("disabled", !renderer.agrid)
            .attr("checked", !!(renderer.agrid && this.getHouse('diag1', renderer.agrid.pos)));
        $("#diag_2")
            .attr("disabled", !renderer.agrid)
            .attr("checked", !!(renderer.agrid && this.getHouse('diag2', renderer.agrid.pos.step(0, this.s-1))));
        $("#selectgrid input[name=selectgrid]").click(function () { renderer.selectGrid(this.value); });
        if ($("#left").hasClass("opened") && $("#left-tabs input:checked").val() === "options" && this.grids.length > 1) {
            renderer.showGridId();
        }
    }).on('message', function (html) {
        $("#sbsInfoText").html(html);
    });
    renderer.on('selectGrid', function () {
        $("#diag_1")
            .attr("disabled", !this.agrid)
            .attr("checked", !!(this.agrid && s.getHouse('diag1', this.agrid.pos)));
        $("#diag_2")
            .attr("disabled", !this.agrid)
            .attr("checked", !!(this.agrid && s.getHouse('diag2', this.agrid.pos.step(0, s.s-1))));
        if (this.agrid) {
            $("#selectgrid" + this.agrid.id).attr("checked", true);
        }
    });
    solver.on('gncStart', function () {
        $("#gncToggle").html("&#9724; Stop");
    }).on('gncStop', function () {
        $("#gncToggle").html("&#9656; Start");
    }).on('waitStep', function () {
        $("#takeStep").addClass("enabled");
    }).on('solve', function () {
        $("#takeStep").removeClass("enabled");
    });
    $("#takeStep").click(function () {
        if ($(this).hasClass("enabled")) {
            solver.step();
        }
        return false;
    });

    var savedConfig;
    try {
        savedConfig = JSON.parse(localStorage.techniques);
    } catch (e) {
        savedConfig = {
            solving: true,
            stepbystep: true,
            NakedSingles: [true, true],
            HiddenSingles: [true, true],
            NakedSubsets: [true, true]
        };
    }
    var sw = function (prop, sbs, value) {
        solver.technique(prop, sbs, value);
        if (savedConfig[prop][sbs ? 1 : 0] !== value) {
            savedConfig[prop][sbs ? 1 : 0] = value;
            localStorage.techniques = JSON.stringify(savedConfig);
        }
    };
    var chgFunc = function (sbs, prop) {
        return function () {
            sw(prop, sbs, this.checked);
        };
    }
    solver.sbs = savedConfig.stepbystep;
    $("#enableSbSSolver").prop("checked", savedConfig.stepbystep).change(function () {
        solver.sbs = this.checked;
        savedConfig.stepbystep = this.checked;
        localStorage.techniques = JSON.stringify(savedConfig);
    });
    solver.solve = savedConfig.solving;
    $("#enableSolver").prop("checked", savedConfig.solving).change(function () {
        solver.solve = this.checked;
        if (solver.solve) {
            solver._change();
        }
        savedConfig.solving = this.checked;
        localStorage.techniques = JSON.stringify(savedConfig);
    });
    sw('NakedSingles', false, savedConfig.NakedSingles[0]);
    sw('NakedSingles', true, savedConfig.NakedSingles[1]);
    $("#NakedSinglesSwitch").prop("checked", savedConfig.NakedSingles[0]).change(chgFunc(false, 'NakedSingles'));
    $("#NakedSinglesSbS").prop("checked", savedConfig.NakedSingles[1]).change(chgFunc(true, 'NakedSingles'));
    sw('HiddenSingles', false, savedConfig.HiddenSingles[0]);
    sw('HiddenSingles', true, savedConfig.HiddenSingles[1]);
    $("#HiddenSinglesSwitch").prop("checked", savedConfig.HiddenSingles[0]).change(chgFunc(false, 'HiddenSingles'));
    $("#HiddenSinglesSbS").prop("checked", savedConfig.HiddenSingles[1]).change(chgFunc(true, 'HiddenSingles'));
    sw('NakedSubsets', false, savedConfig.NakedSubsets[0]);
    sw('NakedSubsets', true, savedConfig.NakedSubsets[1]);
    $("#NakedSubsetsSwitch").prop("checked", savedConfig.NakedSubsets[0]).change(chgFunc(false, 'NakedSubsets'));
    $("#NakedSubsetsSbS").prop("checked", savedConfig.NakedSubsets[1]).change(chgFunc(true, 'NakedSubsets'));

    $("#resetSolution").click(function () {
        var cell = s.headCell;
        while (cell) {
            if (cell.digit && cell.source === 'solver') {
                cell.unset(cell.source);
            }
            cell = cell.next;
        }
    });

    /// Initialize sudoku

    if (location.hash.length > 1) {
        s.load(location.hash.substr(1));
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
    } else if (localStorage.restore) {
        s.load(localStorage.restore);
        notify(
            "Loading sudoku from storage. (<a href=\"#\">Load default sudoku</a>)",
            function () {
                load_sudoku("");
            });
    } else {
        s.load("");
    }

    // keyboard shortcuts
    $(document).keydown(function (e) {
        var ret;
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) switch (e.which) {
            case 27: // Esc
                break;
            case 32: // Space
                if (solver.state >= 0) {
                    solver.step();
                }
                ret = false;
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
        return ret;
    });

    var fitNewSudoku = function () {
        $("#sudokuVariations").css({
            height: (window.innerHeight - 17 - $("#panel").outerHeight()) + 'px',
            top: $("#panel").outerHeight() + 'px'
        });
        $("#solvingTechniques").css({
            top: $("#panel").outerHeight() + 'px',
            left: Math.floor($("#solvingTechniquesSwitch").position().left +
                $("#solvingTechniquesSwitch").outerWidth() / 2 - 100) + 'px'
        });
    };
    $(window).resize(fitNewSudoku);
    setTimeout(function () { fitNewSudoku(); }, 1);

    $("#loadscreen").css({display: "none"});
});
