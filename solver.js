(function() {
  var SudokuSolver;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  SudokuSolver = (function() {
    __extends(SudokuSolver, EventEmitter);
    function SudokuSolver(opts) {
      var defs, _ref;
      if (!(this instanceof SudokuSolver)) {
        return new SudokuSolver(opts);
      }
      defs = {
        solve: false,
        gncSpeed: 50
      };
      extend(defs, opts);
      this._timers = {
        gnc: false
      };
      this.grid = (_ref = defs.grid) != null ? _ref : new SudokuGrid;
      if (!(this.grid instanceof SudokuGrid)) {
        throw new Error('Grid is not of class SudokuGrid');
      }
      this.solve = defs.solve;
      this._nextStepSet = [];
      this._nakedSingles = [];
      this.gncSpeed = defs.gncSpeed;
      this._gnc = false;
      this.history = new DLSet;
      this.grid.on('loadMap', __bind(function() {
        if (this._gnc) {
          this.gncStop();
        }
        this._nextStepSet = [];
        this._nakedSingles = [];
        return this.history = new DLSet;
      }, this));
      this.grid.on('touch', __bind(function(cell) {
        return this._touch(cell);
      }, this));
      this.grid.on('change', __bind(function() {
        return this._change();
      }, this));
      this.grid.on('unset', __bind(function(cell) {
        return this._unset(cell);
      }, this));
      this.grid.on('delHouse', __bind(function(house) {
        return this._delHouse(house);
      }, this));
    }
    SudokuSolver.prototype.commonHouses = function(cells) {
      var cell, obj, t, _, _i, _len, _results;
      t = {};
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.houses.iter(function(house) {
          if (t[house.id] != null) {
            return t[house.id][0] += 1;
          } else {
            return t[house.id] = [1, house];
          }
        });
      }
      _results = [];
      for (_ in t) {
        obj = t[_];
        if (obj[0] === cells.length) {
          _results.push(obj[1]);
        }
      }
      return _results;
    };
    SudokuSolver.prototype._isNakedSubset = function(a) {
      var cand, cell, k, _i, _j, _len, _len2, _ref;
      cand = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        cell = a[_i];
        _ref = cell.rcand;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          k = _ref[_j];
          if (__indexOf.call(cand, k) < 0) {
            cand.push(k);
          }
        }
      }
      if (cand.length === a.length) {
        return {
          digits: cand,
          cells: a
        };
      }
      return null;
    };
    SudokuSolver.prototype.findNakedSubsets = function() {
      var isNS, ns, s;
      ns = [];
      isNS = this._isNakedSubset;
      s = this.grid.s;
      this.grid.houses.iter(function(house) {
        var cell, i, j, k, prob, r, t, _ref, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        if (s - house.filled < 4) {
          return;
        }
        prob = (function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit && !(cell["solverNS" + house.id] != null) && (2 <= (_ref = cell.rcand.length) && _ref <= 4)) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        if (!(2 <= prob.length)) {
          return;
        }
        for (i = 0, _ref = prob.length; i < _ref; i += 1) {
          for (j = _ref2 = i + 1, _ref3 = prob.length; j < _ref3; j += 1) {
            r = isNS([prob[i], prob[j]]);
            if (r != null) {
              r.house = house;
              ns.push(r);
              return false;
            }
          }
        }
        for (i = 0, _ref4 = prob.length; i < _ref4; i += 1) {
          for (j = _ref5 = i + 1, _ref6 = prob.length; j < _ref6; j += 1) {
            for (k = _ref7 = j + 1, _ref8 = prob.length; k < _ref8; k += 1) {
              r = isNS([prob[i], prob[j], prob[k]]);
              if (r != null) {
                r.house = house;
                ns.push(r);
                return false;
              }
            }
          }
        }
        for (i = 0, _ref9 = prob.length; i < _ref9; i += 1) {
          for (j = _ref10 = i + 1, _ref11 = prob.length; j < _ref11; j += 1) {
            for (k = _ref12 = j + 1, _ref13 = prob.length; k < _ref13; k += 1) {
              for (t = _ref14 = k + 1, _ref15 = prob.length; t < _ref15; t += 1) {
                r = isNS([prob[i], prob[j], prob[k], prob[t]]);
                if (r != null) {
                  r.house = house;
                  ns.push(r);
                  return false;
                }
              }
            }
          }
        }
      });
      return ns;
    };
    SudokuSolver.prototype.findHiddenSingles = function() {
      var hs, s;
      hs = [];
      s = this.grid.s;
      this.grid.houses.iter(function(house) {
        var cell, count, empty, k, last, _i, _len;
        empty = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        for (k = 1; 1 <= s ? k <= s : k >= s; 1 <= s ? k++ : k--) {
          count = 0;
          last = false;
          for (_i = 0, _len = empty.length; _i < _len; _i++) {
            cell = empty[_i];
            if (!(cell.cand[k] || cell.mask[k])) {
              count += 1;
              last = cell;
            }
          }
          if (count === 1) {
            hs.push([last, k, house]);
          }
        }
      });
      return hs;
    };
    SudokuSolver.prototype._touch = function(cell) {
      if (cell.digit) {
        return;
      }
      if (cell.rcand.length === 1) {
        return this._nakedSingles.push(cell);
      }
    };
    SudokuSolver.prototype.step = function() {
      var cell, changes, digit, ns, toset, _i, _len, _len2;
      if (this._nextStepSet.length) {
        toset = this._nextStepSet;
        this._nextStepSet = [];
        for (digit = 0, _len = toset.length; digit < _len; digit++) {
          cell = toset[digit];
          try {
            cell.set(digit, 'solver');
          } catch (_e) {}
        }
        return;
      }
      changes = false;
      ns = this._nakedSingles;
      this._nakedSingles = [];
      for (_i = 0, _len2 = ns.length; _i < _len2; _i++) {
        cell = ns[_i];
        if (cell.rcand.length === 1 && !cell.digit && !cell.cand[cell.rcand[0]] && !cell.mask[cell.rcand[0]]) {
          this._nextStepSet.push([cell, cell.rcand[0]]);
          changes = true;
        }
      }
      if (changes) {}
    };
    SudokuSolver.prototype._change = function() {
      var cell, house, houses, hs, k, mask, maskid, ns, ok, q, set, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3;
      if (this.grid.errors) {
        return this.emit('solve');
      }
      set = 0;
      ns = this._nakedSingles;
      this._nakedSingles = [];
      for (_i = 0, _len = ns.length; _i < _len; _i++) {
        cell = ns[_i];
        if (cell.rcand.length !== 1 || cell.digit) {
          continue;
        }
        try {
          cell.set(cell.rcand[0], 'solver');
          set += 1;
        } catch (_e) {}
      }
      if (set) {
        return;
      }
      hs = this.findHiddenSingles();
      for (_j = 0, _len2 = hs.length; _j < _len2; _j++) {
        _ref = hs[_j], cell = _ref[0], k = _ref[1];
        if (cell.digit) {
          continue;
        }
        try {
          cell.set(k, 'solver');
          set += 1;
        } catch (_e) {}
      }
      if (set) {
        return;
      }
      ns = this.findNakedSubsets();
      for (_k = 0, _len3 = ns.length; _k < _len3; _k++) {
        q = ns[_k];
        ok = true;
        _ref2 = q.cells;
        for (_l = 0, _len4 = _ref2.length; _l < _len4; _l++) {
          cell = _ref2[_l];
          if (cell.digit || (cell.solverNS != null)) {
            ok = false;
          }
        }
        if (!ok) {
          continue;
        }
        houses = this.commonHouses(q.cells);
        mask = [];
        for (_m = 0, _len5 = houses.length; _m < _len5; _m++) {
          house = houses[_m];
          for (_n = 0, _len6 = house.length; _n < _len6; _n++) {
            cell = house[_n];
            if (!cell.digit && __indexOf.call(q.cells, cell) < 0 && __indexOf.call(mask, cell) < 0) {
              mask.push(cell);
            }
          }
        }
        set += 1;
        maskid = this.grid.mask(mask, q.digits, 'solver');
        this.grid._history.add({
          action: 'solverNS',
          cells: q.cells,
          maskid: maskid,
          id: "_solverNS_" + maskid,
          houseid: q.house.id
        });
        _ref3 = q.cells;
        for (_o = 0, _len7 = _ref3.length; _o < _len7; _o++) {
          cell = _ref3[_o];
          cell["solverNS" + q.house.id] = true;
        }
      }
      if (set) {
        return;
      }
      return this.emit('solve');
    };
    SudokuSolver.prototype._unset = function(deadCell) {
      var cell, it, rec, _i, _len, _ref;
      it = {
        next: this.grid._history.head
      };
      while (true) {
        it = it.next;
        if (!it) {
          break;
        }
        if (it.dead != null) {
          continue;
        }
        rec = it.e;
        if (rec.action === 'set' && rec.cell === deadCell) {
          break;
        }
        if (rec.action === 'set' && rec.cell.source === 'solver') {
          rec.cell.unset('solver');
        }
        if (rec.action === 'solverNS') {
          _ref = rec.cells;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cell = _ref[_i];
            delete cell["solverNS" + rec.houseid];
          }
          this.grid._history.remove("_solverNS_" + rec.maskid);
          this.grid.unmask(rec.maskid, 'solver');
        }
      }
    };
    SudokuSolver.prototype._delHouse = function(house) {
      var it, rec;
      it = this.grid._history.head;
      while (it) {
        rec = it.e;
        if (rec.action === 'addHouse' && rec.house === house) {
          break;
        }
        if (rec.action === 'set' && rec.cell.source === 'solver') {
          rec.cell.unset('solver');
        }
        it = it.next;
      }
    };
    SudokuSolver.prototype.gncStart = function() {
      if (this._gnc) {
        return this;
      }
      this._gnc = true;
      this._gncSCell = this.grid.headCell;
      this._gncSDigit = 1;
      this.emit('gncStart');
      return this._gncIter();
    };
    SudokuSolver.prototype.gncStop = function() {
      if (!this._gnc) {
        return this;
      }
      this._gnc = false;
      return this.emit('gncStop');
    };
    SudokuSolver.prototype.gncToggle = function() {
      if (this._gnc) {
        return this.gncStop();
      } else {
        return this.gncStart();
      }
    };
    SudokuSolver.prototype.gncReset = function() {
      var cell, _results;
      cell = this.grid.headCell;
      _results = [];
      while (cell) {
        if (cell.digit && cell.source === 'gnc') {
          cell.unset('gnc');
        }
        _results.push(cell = cell.next);
      }
      return _results;
    };
    SudokuSolver.prototype._gncIter = function(stepback) {
      var cell, k, _ref, _ref2;
      if (stepback == null) {
        stepback = false;
      }
      if (!this._gnc) {
        return;
      }
      if (stepback || this.grid.errors) {
        cell = this.grid.tailCell;
        while (cell) {
          if (cell.digit && cell.source === 'gnc') {
            break;
          }
          cell = cell.prev;
        }
        if (!cell) {
          return this.gncStop();
        }
        this._gncSCell = cell;
        this._gncSDigit = cell.digit + 1;
        cell.unset('gnc');
      } else {
        if (this.grid.filled === this.grid.total) {
          return this.gncStop();
        }
        cell = this._gncSCell;
        while (cell) {
          if (!cell.digit) {
            for (k = _ref = this._gncSDigit, _ref2 = this.grid.s; k <= _ref2; k += 1) {
              if (!(cell.cand[k] || cell.mask[k])) {
                break;
              }
            }
            if (k !== this.grid.s + 1) {
              break;
            }
            this._gncSDigit = 1;
            return this._gncIter(true);
          }
          cell = cell.next;
        }
        if (!cell) {
          return this.gncStop();
        }
        cell.set(k, 'gnc');
        this._gncSCell = cell.next;
        this._gncSDigit = 1;
      }
      return this.once('solve', __bind(function() {
        return this._timers.gnc = setTimeout((__bind(function() {
          this._timers.gnc = false;
          return this._gncIter();
        }, this)), this.gncSpeed);
      }, this));
    };
    return SudokuSolver;
  })();
  this.SudokuSolver = SudokuSolver;
}).call(this);
