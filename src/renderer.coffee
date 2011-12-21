
class SudokuRenderer extends EventEmitter
    id: 0

    constructor: (opts) ->
        return new SudokuRenderer opts unless @ instanceof SudokuRenderer
        defs =
            node: $()
            interactive: yes
            axisLabels: yes
            keyboard: no
        extend defs, opts

        @id = "g#{SudokuRenderer::id}"
        SudokuRenderer::id += 1

        @grid = defs.grid ? new SudokuGrid
        throw new Error 'Grid is not of class SudokuGrid' unless @grid instanceof SudokuGrid

        @g =
            # manual
            cell_h: 50, cell_w: 50 # cell size
            sel_h: 20, sel_w: 20 # selector cell size
            padding: 5.5 # padding inside canvas
            # automatic
            canv_w: 0, canv_h: 0 # canvas size
            sel_nh: 0, sel_nw: 0 # selector number of cell
            sel_th: 0, sel_tw: 0 # selector size

        @acell = @agrid = no
        @rootNode = defs.node
        @svg = no
        @needrender = no
        @rendered = no
        @_axisLabels = not not defs.axisLabels
        @_kbd = no
        @rootNode.svg onLoad: (svg) =>
            @svg = svg
            do @render if @needrender
        @interactive = not not defs.interactive
        @timers = selector: no, update: no

        if @grid.headCell then do @render

        if defs.keyboard then do @keyboardOn

        @grid.on 'loadMap', => @selectGrid 0; do @render
        @grid.on 'unloadMap', => @rendered = @needrender = @acell = @agrid = no
        @grid.on 'loadSymb', => do @_loadSymb
        @grid.on 'set', (cell) => @_set cell
        @grid.on 'unset', (cell) => @_unset cell
        @grid.on 'cellChsrc', (cell, old) => @_cellChsrc cell, old
        @grid.on 'addHouse', (house) => @_addHouse house
        @grid.on 'delHouse', (house) => @_delHouse house
        @grid.on 'touch', (cell) => @_touch cell
        @grid.on 'error', (cell) => @_error cell
        @grid.on 'fix', (cell) => @_fix cell
        @grid.on 'mark', (cells) => @showCandidates cell for cell in cells
        @grid.on 'unmark', (cells) => @showCandidates cell for cell in cells
        @grid.on 'markHouse', (house, n) => @_markHouse house, n
        @grid.on 'unmarkHouse', (house) => @_unmarkHouse house

    _markHouse: (house, n) ->
        for cell in house
            $(cell[@id].node).children("rect").addClass "light#{n}"
        return
    _unmarkHouse: (house) ->
        for cell in house
            $(cell[@id].node).children("rect").removeClass "light1 light2 light3 light4"
        return

    hideCandidates: (cell) ->
        cg = cell[@id]
        return unless cg.candgridNode?
        @svg.remove $ cg.candgridNode
        cg.candgridNode = null
    showCandidates: (cell) ->
        return if cell.digit
        cg = cell[@id]
        @svg.remove $ cg.candgridNode if cg.candgridNode?
        cg.candgridNode = @svg.group cg.node, {class_: 'candgrid'}
        stepx = @g.cell_w / @g.sel_nw
        startx = cg.x + stepx / 2
        stepy = @g.cell_h / @g.sel_nh
        starty = cg.y + 4 + stepy / 2
        for j in [0...@g.sel_nw] by 1 then for i in [0...@g.sel_nw] by 1
            d = 1+j*@g.sel_nw+i
            if not cell.cand[d] and not cell.mask[d]
                x = startx + i*stepx
                y = starty + j*stepy
                if cell.colors?[d]?
                    @svg.circle cg.candgridNode, x, y - 3, 6, {fill: cell.colors[d], opacity: 0.4}
                @svg.text cg.candgridNode, x, y, @grid.symb[d], {class_: 'cand'}
        return

    _touch: (cell) ->
        return if cell.digit
        if 1 <= cell.rcand.length <= 4 or cell.colors?
            @showCandidates cell
        else
            @hideCandidates cell

    _error: (cell) ->
        return unless @rendered
        $(cell[@id].node).addClass 'error'

    _fix: (cell) ->
        return unless @rendered
        $(cell[@id].node).removeClass 'error'

    keyboardOff: ->
        return @ unless @_kbd
        $(document).unbind "keydown.SudokuRenderer_#{@id}"
        @_kbd = off
        $(@gr.cells).removeClass 'keyboard' if @rendered
        return @

    keyboardOn: ->
        return @ if @_kbd
        throw new Error 'Sudoku not interactive' unless @interactive
        console.log 'enabling keyboard', document
        $(document).bind "keydown.SudokuRenderer_#{@id}", (e) =>
            return unless @rendered
            return if typeof e.target.form is 'object' or e.altKey or e.shiftKey
            do @grid.undo if e.ctrlKey and e.keyCode is 90 # Ctrl+Z
            return if e.ctrlKey or e.metaKey
            @selectCell @grid.headCell unless @acell
            if 49 <= e.keyCode <= 69 # 1-9 a-
                @acell.unset @acell.source if @acell.digit
                try
                    @acell.set e.keyCode - 48, 'user'
                catch e
            else if 97 <= e.keyCode <= 105 # 1-9 keypad
                @acell.unset @acell.source if @acell.digit
                try
                    @acell.set e.keyCode - 96, 'user'
                catch e
            else if e.keyCode is 8 # backspace
                @selectCell @acell.prev or @grid.tailCell
                @acell.unset @acell.source if @acell.digit
            else if e.keyCode is 46 # delete
                @acell.unset @acell.source if @acell.digit
           # else if e.keyCode is 32 # space
           #     @selectCell @acell.next or @grid.headCell
            else if e.keyCode is 37 # left
                @selectCell @acell.left
            else if e.keyCode is 38 # up
                @selectCell @acell.top
            else if e.keyCode is 39 # right
                @selectCell @acell.right
            else if e.keyCode is 40 # down
                @selectCell @acell.bottom
            else
                console.log 'down', e.keyCode, e if window.pkc
                return
            return false
        @_kbd = on
        $(@gr.cells).addClass 'keyboard' if @rendered
        return @

    _loadSymb: ->
        return unless @rendered
        cell = @grid.headCell
        while cell
            $('text', cell[@id].node).text @grid.symb[cell.digit] if cell.digit
            cell = cell.next
        $('text', @gr.selector.childNodes[i]).text @grid.symb[i] for i in [1..@s] by 1 if @interactive

    _set: (cell) ->
        return unless @rendered
        cg = cell[@id]
        @hideCandidates cell
        @svg.text cg.node,
            cg.x + @g.tx, cg.y + @g.ty,
            @grid.symb[cell.digit], {class_: cell.source}

    _unset: (cell) ->
        return unless @rendered
        @svg.remove $ 'text', cell[@id].node

    _cellChsrc: (cell, old) ->
        return unless @rendered
        $('text', cell[@id].node).removeClass(old).addClass cell.source

    _addHouse: (house) ->
        return unless @rendered
        if house.type in ['diag1', 'diag2']
            for cell in house
                cg = cell[@id]
                continue unless cell.houses[house.type]?.length == 1
                @svg.use cg.node, '#' + house.type,
                    {transform: "translate(#{cg.x}, #{cg.y})", class_: house.type}
                tnode = $(cg.node).children('text') # text to front
                gnode = $(cg.node).children('g') # text to front
                if tnode.length
                    @svg.add cg.node, tnode
                    @svg.remove tnode
                if gnode.length
                    @svg.add cg.node, gnode
                    @svg.remove gnode

    _delHouse: (house) ->
        return unless @rendered
        if house.type in ['diag1', 'diag2']
            for cell in house
                continue unless cell.houses[house.type]?.length == 0
                @svg.remove $ "use.#{house.type}", cell[@id].node

    _cellClick: (e, cell) ->
        return if e.ctrlKey or e.altKey or e.shiftKey or e.metaKey
        if cell.digit and cell.source isnt 'user'
            do cell.setUser
        else if cell.digit
            cell.unset 'user'
        else
            @selectCell cell
            do @showSelector

    selectCell: (cell) ->
        throw new Error 'No such cell' unless @grid.isCell cell
        [oldcell, @acell] = [@acell, cell]
        return @ unless @rendered
        $(oldcell[@id].node).removeClass 'active' if oldcell isnt false
        if @acell
            cg = @acell[@id]
            $(cg.node).addClass 'active'
            #do cg.node.scrollIntoViewIfNeeded
        return @

    _selectorClick: (e, k) ->
        return if not e.shiftKey and (@acell.cand[k] or @acell.mask[k])
        @hideSelector yes
        @acell.set k, 'user', e.shiftKey

    _pos: (i, j) ->
        if not j? then [i, j] = [i.i, i.j]
        x: @g.padding + @g.cell_w * (j + 1)
        y: @g.padding + @g.cell_h * (i + 1)

    _center: (i, j) ->
        if not j? then [i, j] = [i.i, i.j]
        x: @g.padding + @g.cell_w * (j + 1.5)
        y: @g.padding + @g.cell_h * (i + 1.5)

    showSelector: ->
        throw new Error 'Grid is not interactive or not rendered' unless @interactive and @rendered
        throw new Error 'No cell selected' unless @acell
        if @timers.selector
            clearTimeout @timers.selector
            @timers.selector = no
        for k in [0...@grid.s] by 1
            if @acell.cand[1+k] or @acell.mask[1+k]
                $(@gr.selector.childNodes[k]).addClass 'disabled'
            else
                $(@gr.selector.childNodes[k]).removeClass 'disabled'
        acg = @acell[@id]
        nx = acg.x + 0.5*(@g.cell_w - @g.sel_tw)
        ny = acg.y + 0.5*(@g.cell_h - @g.sel_th)
        nx = @g.canv_w - @g.sel_tw if nx + @g.sel_tw > @g.canv_w
        ny = @g.canv_h - @g.sel_th if ny + @g.sel_th > @g.canv_h
        nx = 0 if nx < 0
        ny = 0 if ny < 0
        do $(@gr.selector).attr('transform', "translate(#{nx},#{ny})").show
        do @gr.selector.scrollIntoViewIfNeeded
        return @

    hideSelector: (now) ->
        if now
            if @timers.selector
                clearTimeout @timers.selector
                @timers.selector = no
            do $(@gr.selector).hide
            return @
        return @ if @timers.selector
        @timers.selector = setTimeout (=> do $(@gr.selector).hide; @timers.selector = no), 1000

    render: ->
        if not @svg
            @needrender = yes
            return @
        @needrender = no
        stime = do (new Date()).getTime
        svg = @svg
        g = @g
        g.canv_w = (@grid.mj+1)*g.cell_w + 2*g.padding
        g.canv_h = (@grid.mi+1)*g.cell_h + 2*g.padding
        g.tx = g.cell_w / 2
        g.ty = g.cell_h / 2 + 7
        svg.clear true
        svg.configure {width: g.canv_w, height: g.canv_h}, true
        svg.style """
@-webkit-keyframes 'appear' {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

#cells rect { fill: #fff; stroke: #000; stroke-width: 0.2; }
#cells rect.light1 { fill: #ddddff; }
#cells rect.light2 { fill: #ddffdd; }
#cells rect.light1.light2 { fill: #ddffff; }
#cells rect.light3 { fill: #ffdddd; }
#cells rect.light1.light3 { fill: #ffddff; }
#cells rect.light2.light3 { fill: #ffffdd; }
#cells.keyboard g.active rect { fill: #ccc; }
#cells g.error rect { fill: #f45252; }
#cells g.error.active rect { fill: #f42222; }
#cells text { fill: #666; cursor: default; text-anchor: middle; }
#cells text.user { fill: #000; }
#cells text.solver { fill: #039; -webkit-animation: 'appear' 1s; }
#cells text.gnc { fill: #080; -webkit-animation: 'appear' 0.2s; }
#cells text.cand { fill: #222; cursor: default; text-anchor: middle; font-family: serif; font-size: 10px; }

#selector { opacity: 0.7; }
#selector:hover { opacity: 0.9; }
#selector rect { fill: #fff; stroke: #000; stroke-width: 0.2; stroke-linecap: round; }
#selector g:hover rect { fill: #f3f3f3; }
#selector text { fill: #000; font-size: 12px; text-anchor: middle; cursor: default; }
#selector g.disabled rect { fill: #fff; }
#selector g.disabled text { fill: #ccc; }

#grid_id { opacity: 0.9; fill: #000; stroke: #fff; stroke-width: 2; text-anchor: middle; cursor: default; }
#grid_id text.active { fill: #e00; }
#grid_id text:hover { stroke: #66e; }

"""
        svgdefs = do svg.defs
        d = svg.group svgdefs, {id: 'diag1', fill: '#ccc'}
        svg.circle d, 0.2*g.cell_w, 0.2*g.cell_h, 0.1*g.cell_w
        svg.circle d, 0.5*g.cell_w, 0.5*g.cell_h, 0.1*g.cell_w
        svg.circle d, 0.8*g.cell_w, 0.8*g.cell_h, 0.1*g.cell_w
        d = svg.group svgdefs, {id: 'diag2', fill: '#ccc'}
        svg.circle d, 0.8*g.cell_w, 0.2*g.cell_h, 0.1*g.cell_w
        svg.circle d, 0.5*g.cell_w, 0.5*g.cell_h, 0.1*g.cell_w
        svg.circle d, 0.2*g.cell_w, 0.8*g.cell_h, 0.1*g.cell_w
        gr = @gr = {}
        if @_axisLabels
            gr.coords = svg.group
                fill: '#888'
                'font-size': "#{(0.33*g.cell_h)}px"
                cursor: 'default'
                'text-anchor': 'middle'
            svg.text gr.coords, @_center(0, j).x, g.padding + g.cell_h - 8, "#{(j+1)}" for j in [0...@grid.mj] by 1
            svg.text gr.coords, g.padding + g.cell_w - 10, @_center(i, 0).y + 5, _aa i for i in [0...@grid.mi] by 1
        gr.cells = svg.group
            id: 'cells'
            'font-size': "#{(0.7*g.cell_h)}px"
            class_: if @_kbd then 'keyboard' else ''
        cell = @grid.headCell
        while cell
            p = @_pos cell
            cg = cell[@id] =
                node: svg.group gr.cells
                x: p.x
                y: p.y
                cand: no
            svg.rect cg.node, p.x, p.y, g.cell_w, g.cell_h
            $(cg.node).bind 'click', do (cell) => (e) => @_cellClick e, cell if @interactive
            $(cg.node).addClass 'error' if cell.err
            if cell is @acell
                $(cg.node).addClass 'active'
            if cell.houses.diag1?.length
                svg.use cg.node, '#diag1', {transform: "translate(#{cg.x}, #{cg.y})", class_: 'diag1'}
            if cell.houses.diag2?.length
                svg.use cg.node, '#diag2', {transform: "translate(#{cg.x}, #{cg.y})", class_: 'diag2'}
            if cell.digit
                svg.text cg.node, cg.x + g.tx, cg.y + g.ty,
                    @grid.symb[cell.digit], {class_: cell.source}
            cell = cell.next

        gr.hborder = svg.group
            stroke: '#888'
            'stroke-width': '2.5'
            'stroke-linecap': 'round'
        gr.mborder = svg.group
            stroke: '#000'
            'stroke-width': '2.5'
            'stroke-linecap': 'round'
        cell = @grid.headCell
        while cell
            i = cell.i
            j = cell.j
            p = cell[@id] # coordinate of top left corner
            q = @_pos i+1, j+1 # coordinate of bottom right corner
            if @grid.boxes
                boxId = cell.houses.box.head.e.id
                if cell.left.j + 1 == cell.j and boxId != cell.left.houses.box.head.e.id
                    svg.path gr.hborder, "M#{p.x},#{p.y}L#{p.x},#{q.y}"
                if cell.top.i + 1 == cell.i and boxId != cell.top.houses.box.head.e.id
                    svg.path gr.hborder, "M#{p.x},#{p.y}L#{q.x},#{p.y}"
            svg.path gr.mborder, "M#{p.x},#{p.y}L#{p.x},#{q.y}" if cell.left.j + 1 != cell.j
            svg.path gr.mborder, "M#{p.x},#{p.y}L#{q.x},#{p.y}" if cell.top.i + 1 != cell.i
            svg.path gr.mborder, "M#{p.x},#{q.y}L#{q.x},#{q.y}" if cell.bottom.i - 1 != cell.i
            svg.path gr.mborder, "M#{q.x},#{p.y}L#{q.x},#{q.y}" if cell.right.j - 1 != cell.j
            cell = cell.next

        gr.grid_id = svg.group
            id: 'grid_id'
            'font-size': "#{(0.8*@grid.s*g.cell_h)}px"
        for grid, z in @grid.grids
            x = grid.pos[@id].x + 0.5*@grid.s*g.cell_w
            y = grid.pos[@id].y + 0.7*@grid.s*g.cell_h
            options = if grid == @grid.agrid then class_: 'active' else {}
            grid.id_node = svg.text gr.grid_id, x, y, "#{(z+1)}", options
            $(grid.id_node).click do (z) => => @selectGrid z
        do $(gr.grid_id).hide

        if @interactive
            gr.selector = svg.group id: 'selector'
            g.sel_nw = Math.ceil Math.sqrt @grid.s
            g.sel_nh = Math.floor Math.sqrt @grid.s
            g.sel_tw = g.sel_nw * g.sel_w
            g.sel_th = g.sel_nh * g.sel_h
            k = 1
            for j in [0...g.sel_nh] by 1 then for i in [0...g.sel_nw] by 1
                n = svg.group gr.selector
                svg.rect n, i * g.sel_w, j * g.sel_h, g.sel_w, g.sel_h
                continue if k > @grid.s
                svg.text n, g.sel_w * (i+0.5), g.sel_h * (j+0.7), @grid.symb[k]
                $(n).bind 'click', do (k) => (e) => @_selectorClick e, k
                k += 1
            svg.path gr.selector, "M0,0L0,#{g.sel_th}L#{g.sel_tw},#{g.sel_th}L#{g.sel_tw},0L0,0",
                {fill: 'none', stroke: '#888', 'stroke-width': '1.5'}
            $(gr.selector)
            .bind 'mouseover', =>
                if @timers.selector
                    clearTimeout @timers.selector
                    @timers.selector = no
            .bind 'mouseout', =>
                do @hideSelector
            .hide()

        @rendered = yes
        console.log "rendered in: #{((new Date()).getTime() - stime)}" if window.console?
        return @

    showGridId: -> do $(@gr.grid_id).show if @rendered
    hideGridId: -> do $(@gr.grid_id).hide if @rendered

    selectGrid: (grid) ->
        $(@agrid.id_node).removeClass 'active' if @agrid and @rendered
        @agrid = no
        if typeof grid is 'number' or typeof grid is 'string'
            @agrid = @grid.grids[+grid] if @grid.grids[+grid]?
        else if typeof grid is 'object' and @grid.grids[grid.id]?
            @agrid = @grid.grids[grid.id]
        $(@agrid.id_node).addClass 'active' if @agrid and @rendered
        @emit 'selectGrid'
        return @

@SudokuRenderer = SudokuRenderer
