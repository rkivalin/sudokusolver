
class HouseList extends DLSet
    add: (house) ->
        ref = super house
        @[house.type] ?= new DLList
        ref.tw = @[house.type].add house
        return @
    remove: (house) ->
        ref = super house
        return @ unless ref
        @[house.type].remove ref.tw
        return @

class SudokuCell extends EventEmitter
    constructor: (opts) ->
        @digit = 0 # placed digit (1..size, 0 - empty cell);
        @source = ''
        @houses = new HouseList # list of houses;
        @cand = [] # candidates (0 - is candidate);
        @mask = []
        @colors = null
        @rcand = [] # digits that can be set into this cell (updates with change event)
        @s = 9
        @touched = no
        #solver = ns: {} # ns - naked subset - is cell is a part of a naked subset;
        @err = no # error bit;
        extend @, opts
        @cand.fill [1+@s], 0
        @mask.fill [1+@s], 0
        @id = do @coord

    coord:  -> "#{_aa @i}#{(1+@j)}"
    coordx: -> @_aa @i
    coordy: -> "#{(1+@j)}"

    setUser: ->
        throw new Error 'No digit in the cell' if not @digit
        return @ if @source is 'user'

        [oldsource, @source] = [@source, 'user']
        @emit 'chsrc', oldsource

    set: (k, source, force = no) ->
        throw new Error "Invalid digit: #{k}" if not (1 <= k <= @s) or Math.ceil k isnt k
        throw new Error "Cell already has digit" if @digit
        throw new Error "Cann't set that digit" if not force and (@cand[k] or @mask[k])

        @digit = +k
        @source = source

        t = @grid._touched
        @houses.iter (house) ->
            for sibling in house
                sibling.cand[k] += 1
                unless sibling.touched
                    sibling.touched = yes
                    t.push sibling
            house.filled += 1

        @emit 'set'

    unset: (source) ->
        throw new Error "No digit in the cell" if not @digit
        throw new Error "Access denied" if @source isnt source

        k = @digit
        @digit = 0

        t = @grid._touched
        @houses.iter (house) ->
            for sibling in house
                sibling.cand[k] -= 1
                unless sibling.touched
                    sibling.touched = yes
                    t.push sibling
            house.filled -= 1

        @emit 'unset'

    step: (x, y) ->
        cell = @
        if x >= 0 then cell = cell.bottom while (x -= 1) >= 0
        else cell = cell.top while (x += 1) <= 0
        if y >= 0 then cell = cell.right while (y -= 1) >= 0
        else cell = cell.left while (y += 1) <= 0
        return cell

class SudokuGrid extends EventEmitter
    constructor: (opts) ->
        return new SudokuGrid opts unless @ instanceof SudokuGrid
        defs = {}
        extend defs, opts

        @headCell = @tailCell = no
        @_messages = []

        @_ch = no

    _changed: ->
        return @ if @_ch
        @_ch = yes
        process.nextTick =>
            @_ch = no
            return unless @headCell
            tcopy = @_touched
            @_touched = []
            cell.touched = no for cell in tcopy
            for cell in tcopy
                updated = no
                if cell.digit
                    cell.rcand = []
                    err = cell.cand[cell.digit] != cell.houses.length
                else
                    s = @s
                    newcand = (k for k in [1..s] by 1 when cell.cand[k] + cell.mask[k] == 0)
                    updated = newcand.length != cell.rcand.length
                    if not updated
                        updated = yes for k, i in cell.rcand when k != newcand[i]
                    cell.rcand = newcand if updated
                    err = cell.rcand.length == 0
                if err and not cell.err
                    cell.err = yes
                    @errors += 1
                    @emit 'error', cell
                else if not err and cell.err
                    cell.err = no
                    @errors -= 1
                    @emit 'fix', cell
                @emit 'touch', cell if updated
            @emit 'change'
        return @

    isCell: (cell) -> @headCell and cell instanceof SudokuCell and cell.grid is @

    undo: ->
        it = @_history.head
        while it
            rec = it.e
            if rec.action is 'addHouse'
                @delHouse rec.house
                break
            if rec.action is 'set' and rec.cell.source is 'user'
                rec.cell.unset 'user'
                break
            it = it.next
        return

    clear: ->
        throw new Error 'No map loaded' unless @headCell
        cell = @headCell
        while cell
            cell.unset cell.source if cell.digit
            cell = cell.next
        return @

    unloadMap: (complete = yes) ->
        for t of @timers then if @timers[t]
            clearTimeout @timers[t]
            @timers[t] = no
        delete @[i] for i in ['w', 'h', 'boxes', 's', 'mi', 'mj', 'grids', '_history',
            'houses', 'errors', 'filled', 'ufilled', 'total', '_touched', '_marks', '_houseMarks', 'agrid', 'gr']
        @headCell = @tailCell = no
        @emit 'unloadMap'

    messageID: 0
    message: (html) ->
        id = SudokuGrid::messageID
        SudokuGrid::messageID += 1
        @_messages.push [id, html]
        @emit 'message', html
        return id
    removeMessage: (id) ->
        for e, pos in @_messages when e[0] == id then break
        return if pos >= @_messages.length
        for i in [pos...@_messages.length-1] by 1
            @_messages[i] = @_messages[i+1]
        do @_messages.pop
        @emit 'message', @_messages[@_messages.length-1][1] if pos and pos == @_messages.length

    markHouse: (house) ->
        @_houseMarks.push house
        @emit 'markHouse', house, Math.min 3, @_houseMarks.length
    removeHouseMarks: ->
        hmarks = @_houseMarks
        @_houseMarks = []
        @emit 'unmarkHouse', house for house in hmarks
    mark: (cells, digits, color = 'green') ->
        for cell in cells
            @_marks.push cell
            cell.colors ?= {}
            cell.colors[d] = color for d in digits
        @emit 'mark', cells
    removeMarks: ->
        cells = @_marks
        @_marks = []
        for cell in cells
            cell.colors = null
        @emit 'unmark', cells

    maskID: 0
    mask: (cells, digits, source) ->
        id = SudokuGrid::maskID
        SudokuGrid::maskID += 1
        rec = action: 'mask', id: "_mask_#{id}", cells: [], source: source
        for cell in cells
            rec.cells.push cell
            cell.mask[d] += 1 for d in digits
            unless cell.touched
                cell.touched = yes
                @_touched.push cell
        rec.digits = (d for d in digits)
        @_history.add rec
        do @_changed
        return id

    unmask: (id, source) ->
        rec = @_history["_mask_#{id}"].e
        throw new Error 'No such mask' unless rec?
        throw new Error 'Access denied' unless rec.source == source
        for cell in rec.cells then for d in rec.digits
            cell.mask[d] -= 1
            unless cell.touched
                cell.touched = yes
                @_touched.push cell
        @_history.remove "_mask_#{id}"
        do @_changed

    _cellSet: -> # calls with SudokuCell object
        @grid.filled += 1
        @grid.ufilled += 1 if @source is 'user'
        @grid._history.add action: 'set', cell: @, id: "_set_#{@id}"
        @grid.emit 'set', @
        do @grid._changed
    _cellUnset: -> # calls with SudokuCell object
        @grid.filled -= 1
        @grid.ufilled -= 1 if @source is 'user'
        @grid.emit 'unset', @
        @grid._history.remove "_set_#{@id}"
        do @grid._changed
    _cellChsrc: (old) -> # calls with SudokuCell object
        @grid.ufilled += 1 if @source is 'user'
        @grid.ufilled -= 1 if old is 'user'
        @grid.emit 'cellChsrc', @, old
        do @grid._changed

    saveMap: ->
        map = []
        map.push "#{@h}x#{@w}" if @h != 3 or @w != 3
        defgrid = @grids.length == 1 and @grids[0].pos.i == 0 and @grids[0].pos.j == 0
        map.push "#{grid.pos.i}:#{grid.pos.j}" for grid in @grids unless defgrid
        h = []
        @houses.iter (house) ->
            if house.type in ['diag1', 'diag2']
                h.push "h=#{house.type}:#{house.s}"
        while h.length then map.push do h.pop
        map.push "symb=#{@symbtxt}" if @symbtxt != false
        map.join ','

    saveData: ->
        data = ''
        sp = 0
        cell = @headCell
        while cell
            if cell.digit and cell.source is 'user'
                data += '*'.repeat Math.floor sp/25
                sp %= 25
                data += ':'.repeat Math.floor sp/5
                sp %= 5
                data += '.'.repeat(sp) + @symb[cell.digit].pad @symbSize, '_', 'left'
                sp = 0
            else
                sp += 1
            cell = cell.next
        data

    loadData: (data) ->
        return @ unless data? and typeof data is 'string'
        cell = @headCell
        for c, i in data
            break unless cell
            if c is '.' then cell = cell.next
            else if c is ':' then cell = cell.next for j in [0...5] when cell
            else if c is '*' then cell = cell.next for j in [0...25] when cell
            else
                k = @symb.indexOf data.substr(i, @symbSize).replace ///_///g, ''
                if 1 <= k <= @s
                    cell.set k, 'user', yes
                    i += @symbSize - 1
                cell = cell.next
        return @

    load: (data) ->
        throw new Error "Type of data is '#{typeof data}', expected: 'string'" unless typeof data is 'string'
        data = data.split ///\,///
        map = h: 3, w: 3, grids: [], houses: []
        i = 0
        vars = l: 1
        if i < data.length and data[i].match ///^\d+x\d+$///
            t = data[i].split ///x///
            map.h = +t[0]
            map.w = +t[1]
            i += 1
        while i < data.length and data[i].match ///^\d+:\d+$///
            t = data[i].split ///:///
            map.grids.push [+t[0], +t[1]]
            i += 1
        map.grids.push [0, 0] unless map.grids.length
        while i < data.length and data[i].match ///^h=[a-zA-Z0-9]+:[A-Z]+[0-9]+$///
            t = data[i].split(///=///)[1].split ///:///
            map.houses.push type: t[0], start: t[1]
            i += 1
        while i < data.length and data[i].match ///^\w+=.+$///
            t = data[i].split ///=///
            vars[t[0]] = t[1]
            i += 1
        map.symb = vars.symb if vars.symb?
        map.data = data[i] if i == data.length - 1
        @loadMap map

    loadMap: (map) ->
        stime = do (new Date).getTime
        @unloadMap no if @headCell
        defs =
            w: 3
            h: 3
            grids: [[0, 0]]
        extend defs, map

        @_touched = []
        @_history = new DLSet
        @_marks = []
        @_houseMarks = []

        @w = Math.floor +defs.w
        @h = Math.floor +defs.h
        @w = @h = 3 if not (1 <= @w <= 100000 and 1 <= @h <= 100000)
        [@h, @w] = [@w, 1] if @h is 1
        @boxes = @w isnt 1
        @s = @w * @h

        @loadSymb defs.symb

        @mi = @mj = 0
        vgrids = for grid in defs.grids
            i = Math.floor +grid[0]
            j = Math.floor +grid[1]
            continue if not (0 <= i <= 100000 and 0 <= j <= 100000) or @boxes and (i % @h or j % @w)
            @mi = i + @s if i + @s > @mi
            @mj = j + @s if j + @s > @mj
            [i, j]
        if vgrids.length == 0
            vgrids.push [0, 0]
            @mi = @mj = @s

        rows = {}
        cols = {}
        @errors = @filled = @ufilled = @total = 0
        @grids = []
        @houses = new HouseList
        for g in vgrids
            [a, b] = g
            grid = {}
            grid.id = @grids.push(grid) - 1
            for j in [b...b+@s] by 1 then for i in [a...a+@s] by 1 then if not rows[i]?[j]?
                rows[i] ?= {}
                cols[j] ?= {}
                cols[j][i] = rows[i][j] = new SudokuCell s: @s, i: i, j: j, grid: @
                rows[i][j].on 'set', @_cellSet
                rows[i][j].on 'unset', @_cellUnset
                rows[i][j].on 'chsrc', @_cellChsrc
                @total += 1
            grid.pos = rows[a][b]

        rowNums = []
        rowNums.push +r for r of rows
        rowNums.sort (a, b) -> a - b
        colNums = []
        colNums.push +c for c of cols
        colNums.sort (a, b) -> a - b

        cell = @headCell = {}
        for i in rowNums
            rowHead = no
            for j in colNums then if rows[i][j]?
                cell.next = rows[i][j]
                if not rowHead then rowHead = rows[i][j]
                else
                    cell.right = rows[i][j]
                    cell.right.left = cell
                cell.next.prev = cell
                cell = cell.next
            cell.right = rowHead
            cell.right.left = cell
        @tailCell = cell
        @headCell = @headCell.next
        @headCell.prev = @tailCell.next = no
        for i in colNums
            colHead = no
            for j in rowNums then if cols[i][j]?
                if not colHead then colHead = cols[i][j]
                else
                    cell.bottom = cols[i][j]
                    cell.bottom.top = cell
                cell = cols[i][j]
            cell.bottom = colHead
            cell.bottom.top = cell

        for grid in @grids
            colStart = rowStart = grid.pos
            for i in [0...@s] by 1
                @addHouse 'col', colStart
                @addHouse 'row', rowStart
                @addHouse 'box', grid.pos.step (i%@h) * @w, Math.floor(i/@h) * @h
                colStart = colStart.right
                rowStart = rowStart.bottom

        if defs.houses? and defs.houses instanceof Array
            for house in defs.houses
                cell = @getCellByAddr house.start
                continue unless cell
                @addHouse house.type, cell if house.type in ['diag1', 'diag2']

        @loadData defs.data if defs.data?

        console.log "built map in: #{((new Date()).getTime() - stime)}" if window.console?

        @emit 'loadMap'
        do @_changed

    loadSymb: (s) ->
        @symbtxt = false
        if typeof s is 'string' and s.length and s.length % @s == 0
            @symbtxt = s
            n = s.length / @s
            @symb = ['']
            @symb.push s.substr(i * n, n) for i in [0...@s] by 1
        else if @s < 16
            @symb = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
        else
            @symb = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
            @symb.push _aa i for i in [0...@s-10] by 1
        @symbSize = @symb[@symb.length - 1].length
        @emit 'loadSymb'
        do @_changed
        return @

    addHouse: (type, start) ->
        throw new Error 'No map loaded' unless @headCell
        house = type: type, filled: 0, length: @s, s: start.id
        house.id = "_#{house.type}_#{house.s}"
        return @ if @houses[house.id]?
        switch house.type
            when 'col'
                cell = start
                for i in [0...@s] by 1
                    house[i] = cell
                    cell = cell.bottom
                house.p = yes # protect from removing
            when 'row'
                cell = start
                for i in [0...@s] by 1
                    house[i] = cell
                    cell = cell.right
                house.p = yes # protect from removing
            when 'box'
                return @ if not @boxes
                house[i*@h + j] = start.step i, j for j in [0...@h] by 1 for i in [0...@w] by 1
                house.p = yes # protect from removing
            when 'diag1'
                cell = start
                for i in [0...@s] by 1
                    house[i] = cell
                    cell = cell.right.bottom
            when 'diag2'
                cell = start
                for i in [0...@s] by 1
                    house[i] = cell
                    cell = cell.left.bottom
            else throw new Error "Unknown house type: #{type}"
        for cell in house
            cell.houses.add house # i-th cell now have reference to this house
            unless house.p? or cell.touched
                @_touched.push cell
                cell.touched = yes
            if cell.digit
                scell.cand[cell.digit] += 1 for scell in house
                house.filled += 1
        @houses.add house
        unless house.p?
            @_history.add action: 'addHouse', house: house, id: "_addHouse_#{house.id}"
            @emit 'addHouse', house
            do @_changed
        return @

    getHouse: (type, start) -> @houses["_#{type}_#{start.id}"]?.e

    delHouse: (type, start) ->
        throw new Error 'No map loaded' if not @headCell
        house = if start? then @getHouse type, start else type
        throw new Error 'No such house' if not house
        throw new Error 'Can not remove protected houses' if house.p?
        for cell in house
            cell.houses.remove house
            unless cell.touched
                @_touched.push cell
                cell.touched = yes
            if cell.digit
                scell.cand[cell.digit] -= 1 for scell in house
        @houses.remove house
        @emit 'delHouse', house
        @_history.remove "_addHouse_#{house.id}"
        do @_changed

    getCellByNumber: (number) -> # slow
        [cell, m, dir] = if number < 0 then [@tailCell, 1, 'prev'] else [@headCell, -1, 'next']
        while cell
            return cell if number == 0
            number += m
            cell = cell[dir]
        return false

    getCellByAddr: (addr) -> # slow
        r = addr.match ///^([A-Z]+)(\d+)$///
        return false unless r?
        [_, row, col] = r
        i = _aa2i row
        j = +col - 1
        cell = @headCell
        while cell
            return cell if cell.i == i and cell.j == j
            cell = cell.next
        return false

    dumpHist: ->
        it = @_history.head
        while it
            rec = it.e
            console.log rec.id, rec
            it = it.next
        return

@SudokuGrid = SudokuGrid
