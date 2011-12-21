
SudokuSolver.prototype.solvelog = function (type, o1, o2, o3, o4) {
    return;
    var line, n;
    n = this.loglines.push(line = {type: type});
    switch (type) {
      case 'naked_single':
        line.cells = o1;
        if (line.cells.length > 1) {
            var clist = coord(line.cells[0]) + " — " + this.symb[line.cells[0].digit];
            for (var i = 1; i < line.cells.length; i++)
                clist += "; " + coord(line.cells[i]) + " — " + this.symb[line.cells[i].digit];
            this.nodes.log.append("<p>Naked singles in the cells " + clist + "</p>");
        } else {
            this.nodes.log.append("<p>Naked single in the cell " +
                coord(line.cells[0]) + " — set to " + this.symb[line.cells[0].digit] + "</p>");
        }
        break;
      case 'hidden_single':
        line.cell = o1;
        line.house = o2;
        this.nodes.log.append("<p>Hidden single in the " + line.house.id + "-" +
            (["column", "row", "box", "diagonal", "antidiagonal"])[line.house.type] + " — set " +
            coord(line.cell) + " to " + this.symb[line.cell.digit] + "</p>");
        break;
      case 'naked_subset':
        line.cells = o1;
        line.digits = o2;
        line.done = o3;
        var clist = coord(line.cells[0]);
        for (var i = 1; i < line.cells.length; i++) {
            clist += ", " + coord(line.cells[i]);
        }
        var dlist = this.symb[line.digits[0]];
        for (var i = 1; i < line.digits.length; i++) {
            dlist += ", " + this.symb[line.digits[i]];
        }
        this.nodes.log.append("<p>Naked " + (['', '', "pair", "triple", "quad"])[line.cells.length] + ": " +
            clist + " — removing " + dlist + " from common houses</p>");
        break;
      default:
        this.nodes.log.append("<p>" + line.type + "</p>");
        break;
    }
    this.nodes.log.scrollTop(this.nodes.log[0].scrollHeight);
}

function naked_subset_match(cells) {
    var have = [], i, j, k;
    for (i = 0; i < cells.length; i++) for (j = 0; j < cells[i].rcand.length; j++) {
        for (k = 0; k < have.length; k++) if (have[k] === cells[i].rcand[j]) {
            break;
        }
        if (k === have.length) {
            have.push(cells[i].rcand[j]);
        }
    }
    return cells.length === have.length ? have : false;
}

function common_houses(cells) {
    var t = {}, h = [], i, j;
    for (i = 0; i < cells.length; i++) for (j = 0; j < cells[i].houses.length; j++) {
        if (t[cells[i].houses[j].s]) {
            t[cells[i].houses[j].s][0]++;
        } else {
            t[cells[i].houses[j].s] = [1, cells[i].houses[j]];
        }
    }
    for (i in t) if (t[i][0] === cells.length) {
        h.push(t[i][1]);
    }
    return h;
}

SudokuSolver.prototype.solve_naked_subset = function () {
    var p, i, j, k, max = Math.floor(this.s / 2), cmax, empty, ret = 0;
    for (p in this.houses)
    if ((cmax = this.s - this.houses[p].filled - this.houses[p].ns - 2) > 0) {
        if (max < cmax) {
            cmax = max;
        }
        for (k = 2; k <= cmax; k++) {
            for (j = 0, empty = []; j < this.s; j++)
            if (this.houses[p][j] && !this.houses[p][j].digit &&
                !this.houses[p][j].solver.ns[this.houses[p].s] &&
                this.houses[p][j].rcand.length <= k)
                empty.push(this.houses[p][j]);
            if (this.solve_naked_subset_rec(this.houses[p], k, empty, [], 0)) {
                ret++;
                break;
            }
        }
    }
    return ret;
}

SudokuSolver.prototype.solve_naked_subset_rec = function (house, s, cells, m, start) {
    var i, j, z, k, mm, have, ch, w;
    for (z = start; z < cells.length; z++) {
        m.push(cells[z]);
        if (m.length < s) {
            if (this.solve_naked_subset_rec(house, s, cells, m, z + 1)) return true;
            m.pop();
            continue;
        }
        ch = common_houses(m);
        if (!ch.length) continue;
        if (have = naked_subset_match(m)) {
            for (i = 0, mm = []; i < m.length; i++) mm.push(m[i]);
            w = [];
            house.ns += s;
            for (i = 0; i < mm.length; i++) mm[i].solver.ns[house.s] = true;
            for (i = 0; i < ch.length; i++) for (j = 0; j < this.s; j++)
            if (!ch[i][j].digit && !in_array(mm, ch[i][j]))
            for (k = 0; k < have.length; k++)
            if (!ch[i][j].cand[have[k]] && !ch[i][j].mask[have[k]]) {
                ch[i][j].mask[have[k]] = true;
                w.push(ch[i][j], have[k]);
            }
            if (w.length)
                this.solvelog('naked_subset', mm, have, w);
            return true;
        }
        m.pop();
    }
    return false;
}
