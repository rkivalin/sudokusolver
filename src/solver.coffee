
class NakedSingles
    constructor: (@solver) ->
        @grid = @solver.grid
        @cand = []
        @found = []
        @enabled = yes
        @sbs = yes
        @touchCB = (cell) =>
            return if cell.digit
            if @enabled and cell.rcand.length == 1 # naked single
                @cand.push cell
        @grid.on 'touch', @touchCB if @enabled

    enable: ->
        return if @enabled
        @enabled = yes
        @grid.on 'touch', @touchCB

    disable: ->
        return unless @enabled
        @enabled = no
        @grid.removeListener 'touch', @touchCB

    set: ->
        cand = @cand
        @cand = []
        result = no
        for cell in cand
            if cell.rcand.length == 1
                try
                    cell.set cell.rcand[0], 'solver'
                    result = yes
        return result

    search: ->
        throw new Error 'New search while old results are not used!' if @found.length
        cellList = []
        cand = @cand
        @cand = []
        for cell in cand
            if cell.rcand? and cell.rcand.length == 1 and not cell.digit and not cell.cand[cell.rcand[0]] and not cell.mask[cell.rcand[0]]
                @found.push [cell, cell.rcand[0]]
                @grid.mark [cell], [cell.rcand[0]], 'green'
                cellList.push "<span class=\"cellRef\">#{cell.id}</span>"
        if @found.length
            one = cellList.length == 1
            text = "Cell#{if one then '' else 's'} #{cellList.join ', '} ha#{if one then 's' else 've'} only one candidate remaining."
            @msgid = @grid.message text
            return yes
        return no

    apply: ->
        do @grid.removeMarks
        @grid.removeMessage @msgid
        found = @found
        @found = []
        for [cell, k] in found
            if cell.rcand.length == 1
                try cell.set k, 'solver'
        return

    discard: ->
        do @grid.removeMarks
        @grid.removeMessage @msgid
        found = @found
        @found = []
        @cand.push cell for cell in found
        return

class HiddenSingles
    constructor: (@solver) ->
        @grid = @solver.grid
        @cand = []
        @found = null
        @enabled = yes
        @sbs = yes

    enable: -> @enabled = yes
    disable: -> @enabled = no

    findall: ->
        s = @grid.s
        cand = @cand
        @grid.houses.iter (house) ->
            empty = (cell for cell in house when not cell.digit)
            for k in [1..s]
                count = 0
                last = no
                for cell in empty
                    unless cell.cand[k] or cell.mask[k]
                        count += 1
                        last = cell
                cand.push [last, k, house] if count == 1 # its hidden single
            return

    set: ->
        @cand = []
        do @findall
        cand = @cand
        result = no
        for [cell, k] in cand
            try
                cell.set k, 'solver'
                result = yes
        return result

    search: ->
        throw new Error 'New search while old results are not used!' if @found?
        @cand = []
        do @findall
        return no unless @cand.length
        @found = @cand[0]
        [cell, k, house] = @found
        @grid.mark [cell], [k], 'green'
        @grid.markHouse house
        text = "The only one candidate #{k} remaining in #{house.type}-#{house.s}"
        @msgid = @grid.message text
        return yes

    apply: ->
        do @grid.removeMarks
        do @grid.removeHouseMarks
        @grid.removeMessage @msgid
        [cell, k] = @found
        @found = null
        try cell.set k, 'solver'
        return

    discard: ->
        do @grid.removeMarks
        do @grid.removeHouseMarks
        @grid.removeMessage @msgid
        @found = null
        @cand = []
        return

class NakedSubsets
    constructor: (@solver) ->
        @grid = @solver.grid
        @found = null
        @enabled = yes
        @sbs = yes

    enable: -> @enabled = yes
    disable: -> @enabled = no

    commonHouses: (cells) ->
        t = {}
        for cell in cells
            cell.houses.iter (house) ->
                if t[house.id]? then t[house.id][0] += 1
                else t[house.id] = [1, house]
        obj[1] for _, obj of t when obj[0] == cells.length

    _isNakedSubset: (a) ->
        cand = []
        for cell in a
            cand.push k for k in cell.rcand when k not in cand
        return {digits: cand, cells: a} if cand.length == a.length
        return null

    findNakedSubsets: ->
        ns = []
        isNS = @_isNakedSubset
        s = @grid.s
        @grid.houses.iter (house) ->
            return if s - house.filled < 4
            prob = (cell for cell in house when not cell.digit and not cell["solverNS#{house.id}"]? and 2 <= cell.rcand.length <= 4)
            return unless 2 <= prob.length
            #console.log 'look for naked subsets in', house.id, ':', (i.id for i in prob)
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                r = isNS [prob[i], prob[j]]
                if r?
                    r.house = house
                    ns.push r
#                    return false
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                for k in [j+1...prob.length] by 1
                    r = isNS [prob[i], prob[j], prob[k]]
                    if r?
                        r.house = house
                        ns.push r
#                        return false
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                for k in [j+1...prob.length] by 1 then for t in [k+1...prob.length] by 1
                    r = isNS [prob[i], prob[j], prob[k], prob[t]]
                    if r?
                        r.house = house
                        ns.push r
#                        return false
            return
        #console.log ns if ns.length
        return ns

    set: ->
        ns = do @findNakedSubsets
        for q in ns
            ok = yes
            ok = no for cell in q.cells when cell.digit or cell.solverNS?
            continue unless ok
            houses = @commonHouses q.cells
            mask = []
            for house in houses then for cell in house
                if not cell.digit and cell not in q.cells and cell not in mask
                    mask.push cell
            continue unless mask.length
            maskid = @grid.mask mask, q.digits, 'solver'
            @grid._history.add action: 'solverNS', cells: q.cells, maskid: maskid, id: "_solverNS_#{maskid}", houseid: q.house.id
            cell["solverNS#{q.house.id}"] = true for cell in q.cells
            return yes
        return no

    search: ->
        throw new Error 'New search while old results are not used!' if @found?
        ns = do @findNakedSubsets
        for q in ns
            ok = yes
            ok = no for cell in q.cells when cell.digit or cell.solverNS?
            continue unless ok
            houses = @commonHouses q.cells
            mask = []
            for house in houses then for cell in house
                if not cell.digit and cell not in q.cells and cell not in mask
                    mask.push cell
            realMasks = 0
            for cell in mask then for d in q.digits
                realMasks += 1 if not cell.cand[d] and not cell.mask[d]
            continue unless realMasks
            @grid.markHouse h for h in houses
            @found = [mask, q]
            @grid.mark q.cells, q.digits, 'green'
            @grid.mark mask, q.digits, 'red'
            @msgid = @grid.message "Naked subset in #{(cell.id for cell in q.cells).join ', '}"
            return yes
        return no

    apply: ->
        do @grid.removeMarks
        do @grid.removeHouseMarks
        @grid.removeMessage @msgid
        [mask, q] = @found
        @found = null
        maskid = @grid.mask mask, q.digits, 'solver'
        @grid._history.add action: 'solverNS', cells: q.cells, maskid: maskid, id: "_solverNS_#{maskid}", houseid: q.house.id
        cell["solverNS#{q.house.id}"] = true for cell in q.cells
        return

    discard: ->
        do @grid.removeMarks
        do @grid.removeHouseMarks
        @grid.removeMessage @msgid
        @found = null
        return


class SudokuSolver extends EventEmitter
    constructor: (opts) ->
        return new SudokuSolver opts unless @ instanceof SudokuSolver
        defs =
            solve: no
            gncSpeed: 50
        extend defs, opts
        @_timers = gnc: no

        @grid = defs.grid ? new SudokuGrid
        throw new Error 'Grid is not of class SudokuGrid' unless @grid instanceof SudokuGrid

        @solve = defs.solve
        @sbs = yes
        @algo = [
            ["NakedSingles", new NakedSingles @]
            ["HiddenSingles", new HiddenSingles @]
            ["NakedSubsets", new NakedSubsets @]
        ]
        @state = -1

        @gncSpeed = defs.gncSpeed
        @_gnc = no

        @history = new DLSet

        @grid.message 'Enter your starting digits, solution will appear on the fly.'

        @grid.on 'loadMap', =>
            do @gncStop if @_gnc
            @history = new DLSet
            if @state >= 0
                s = @state
                @state = -1
                console.log "    discarding #{@algo[s][0]} because new sudoku loaded"
                do @algo[s][1].discard
                @emit 'solve'
        @grid.on 'change', => do @_change
        @grid.on 'unset', (cell) => @_unset cell
        @grid.on 'delHouse', (house) => @_delHouse house
        @grid.on 'error', (cell) =>
            if @state >= 0
                s = @state
                @state = -1
                console.log "    discarding #{@algo[s][0]} because of an error in #{cell.id}"
                do @algo[s][1].discard
                @emit 'solve'

    commonHouses: (cells) ->
        t = {}
        for cell in cells
            cell.houses.iter (house) ->
                if t[house.id]? then t[house.id][0] += 1
                else t[house.id] = [1, house]
        obj[1] for _, obj of t when obj[0] == cells.length

    _isNakedSubset: (a) ->
        cand = []
        for cell in a
            cand.push k for k in cell.rcand when k not in cand
        return {digits: cand, cells: a} if cand.length == a.length
        return null

    findNakedSubsets: ->
        ns = []
        isNS = @_isNakedSubset
        s = @grid.s
        @grid.houses.iter (house) ->
            return if s - house.filled < 4
            prob = (cell for cell in house when not cell.digit and not cell["solverNS#{house.id}"]? and 2 <= cell.rcand.length <= 4)
            return unless 2 <= prob.length
            #console.log 'look for naked subsets in', prob
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                r = isNS [prob[i], prob[j]]
                if r?
                    r.house = house
                    ns.push r
                    return false
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                for k in [j+1...prob.length] by 1
                    r = isNS [prob[i], prob[j], prob[k]]
                    if r?
                        r.house = house
                        ns.push r
                        return false
            for i in [0...prob.length] by 1 then for j in [i+1...prob.length] by 1
                for k in [j+1...prob.length] by 1 then for t in [k+1...prob.length] by 1
                    r = isNS [prob[i], prob[j], prob[k], prob[t]]
                    if r?
                        r.house = house
                        ns.push r
                        return false
            return
        return ns

    findHiddenSingles: ->
        hs = []
        s = @grid.s
        @grid.houses.iter (house) ->
            empty = (cell for cell in house when not cell.digit)
            for k in [1..s]
                count = 0
                last = no
                for cell in empty
                    unless cell.cand[k] or cell.mask[k]
                        count += 1
                        last = cell
                hs.push [last, k, house] if count == 1 # its hidden single
            return
        return hs

    step: ->
        if @state >= 0
            console.log "    Got step request"
            s = @state
            @state = -1
            do @algo[s][1].apply
            @emit 'solve' unless @solve
            return

        return @emit 'solve' if @grid.errors or not @solve
        console.log "Searching for solutions..."
        for [name, a], i in @algo
            continue unless a.enabled
            if @sbs and a.sbs
                console.log "Trying #{name} (step by step)"
                if do a.search
                    console.log "    #{name} succeed"
                    @state = i
                    @emit 'waitStep'
                    return
            else
                console.log "Trying #{name} (fast)"
                if do a.set
                    console.log "    #{name} succeed"
                    return
        console.log "Nothing left to do"
        @emit 'solve'
        return

    technique: (technique, sbs, enabled) ->
        for alg, i in @algo
            if alg[0] == technique
                break
        return false if i == solver.algo.length
        if sbs
            alg[1].sbs = enabled
        else
            if enabled
                if not alg[1].enabled
                    alg[1].enable()
                    @_change()
            else
                if alg[1].enabled
                    alg[1].disable()

    _change: ->
        return @emit 'solve' if @grid.errors
        return if @state >= 0 or not @solve
        console.log "Grid updated"
        do @step
        return

        return if @_nextStepSet.length
        return @emit 'solve' if @grid.errors
        do @step
        @emit 'solve' unless @_nextStepSet.length
        return
        set = 0
        ns = @_nakedSingles
        @_nakedSingles = []
        for cell in ns
            continue if cell.rcand.length != 1 or cell.digit
            try
                cell.set cell.rcand[0], 'solver'
                set += 1
        return if set
        hs = do @findHiddenSingles
        for [cell, k] in hs
            continue if cell.digit
            try
                cell.set k, 'solver'
                set += 1
        return if set
        ns = do @findNakedSubsets
        for q in ns
            ok = yes
            ok = no for cell in q.cells when cell.digit or cell.solverNS?
            continue unless ok
            houses = @commonHouses q.cells
            mask = []
            for house in houses then for cell in house
                if not cell.digit and cell not in q.cells and cell not in mask
                    mask.push cell
            set += 1
            maskid = @grid.mask mask, q.digits, 'solver'
            @grid._history.add action: 'solverNS', cells: q.cells, maskid: maskid, id: "_solverNS_#{maskid}", houseid: q.house.id
            cell["solverNS#{q.house.id}"] = true for cell in q.cells
            #console.log 'Naked subset found (houses:', houses, ' cells:', q.cells, 'mask:', mask, 'digits:', q.digits, ')'
        return if set
        @emit 'solve'

    _unset: (deadCell) ->
        if @state >= 0
            s = @state
            @state = -1
            console.log "    discarding #{@algo[s][0]} because #{deadCell.id} lost its digit"
            do @algo[s][1].discard
            @emit 'solve'
        it = next: @grid._history.head
        loop
            it = it.next
            break unless it
            continue if it.dead?
            rec = it.e
            break if rec.action is 'set' and rec.cell is deadCell
            rec.cell.unset 'solver' if rec.action is 'set' and rec.cell.source is 'solver'
            if rec.action is 'solverNS'
                delete cell["solverNS#{rec.houseid}"] for cell in rec.cells
                @grid._history.remove "_solverNS_#{rec.maskid}"
                @grid.unmask rec.maskid, 'solver'
        return

    _delHouse: (house) ->
        it = @grid._history.head
        while it
            rec = it.e
            break if rec.action is 'addHouse' and rec.house is house
            rec.cell.unset 'solver' if rec.action is 'set' and rec.cell.source is 'solver'
            it = it.next
        return

    gncStart: ->
        return @ if @_gnc
        @_gnc = yes
        @_gncSCell = @grid.headCell
        @_gncSDigit = 1
        @emit 'gncStart'
        do @_gncIter

    gncStop: ->
        return @ unless @_gnc
        @_gnc = no
        @emit 'gncStop'

    gncToggle: ->
        if @_gnc then do @gncStop
        else do @gncStart

    gncReset: ->
        cell = @grid.headCell
        while cell
            cell.unset 'gnc' if cell.digit and cell.source is 'gnc'
            cell = cell.next

    _gncIter: (stepback = no) ->
        return if not @_gnc
        if stepback or @grid.errors
            cell = @grid.tailCell
            while cell
                break if cell.digit and cell.source is 'gnc'
                cell = cell.prev
            return do @gncStop unless cell
            @_gncSCell = cell
            @_gncSDigit = cell.digit + 1
            cell.unset 'gnc'
        else
            return do @gncStop if @grid.filled == @grid.total
            cell = @_gncSCell
            while cell
                unless cell.digit
                    for k in [@_gncSDigit..@grid.s] by 1
                        break unless cell.cand[k] or cell.mask[k]
                    break unless k == @grid.s + 1
                    @_gncSDigit = 1
                    return @_gncIter yes
                cell = cell.next
            return do @gncStop unless cell
            cell.set k, 'gnc'
            @_gncSCell = cell.next
            @_gncSDigit = 1
        @once 'solve', =>
            @_timers.gnc = setTimeout (=>
                @_timers.gnc = no
                do @_gncIter), @gncSpeed

@SudokuSolver = SudokuSolver
