window.Event = new Vue();

Vue.component('sandbox', {
  template: `
    <div class="body-wrap">
      <event-manager />
      <menu-list :list="tree" />
      <annotation />
    </div>
  `,
  data() {
    return {
      tree: [
        {
          name: 'Red',
          type: 'Layer',
          open: false,
          elt: {},
          depth: 0,
          selected: true,
          children: [
            {
              name: 'Royals',
              type: 'Layer',
              open: false,
              elt: {},
              depth: 1,
              selected: false,
              children: [
                {
                  name: 'King',
                  type: 'Group',
                  open: false,
                  elt: {},
                  depth: 2,
                  selected: false,
                  children: []
                },
                {
                  name: 'Queen',
                  type: 'Text',
                  open: false,
                  elt: {},
                  depth: 2,
                  selected: false,
                  children: []
                },
              ]
            },
            {
              name: 'Bishop',
              type: 'Group',
              open: false,
              elt: {},
              depth: 1,
              selected: false,
              children: []
            },
            {
              name: 'Rook',
              type: 'Text',
              open: false,
              elt: {},
              depth: 1,
              selected: false,
              children: []
            },
          ]
        },
        {
          name: 'Green',
          type: 'Layer',
          open: false,
          elt: {},
          depth: 0,
          selected: false,
          children: [
            {
              name: 'Pawns',
              type: 'Layer',
              open: false,
              elt: {},
              depth: 1,
              selected: false,
              children: [
                {
                  name: 'Purple',
                  type: 'Group',
                  open: false,
                  elt: {},
                  depth: 2,
                  selected: false,
                  children: [
                    {
                      name: 'Pawn',
                      type: 'Path',
                      open: false,
                      elt: {},
                      depth: 2,
                      selected: false,
                      children: []
                    },
                    {
                      name: 'Pawn',
                      type: 'Path',
                      open: false,
                      elt: {},
                      depth: 2,
                      selected: false,
                      children: []
                    },
                  ]
                },
                {
                  name: 'Orange',
                  type: 'Group',
                  open: false,
                  elt: {},
                  depth: 2,
                  selected: false,
                  children: [
                    {
                      name: 'Pawn',
                      type: 'Path',
                      open: false,
                      elt: {},
                      depth: 2,
                      selected: false,
                      children: []
                    },
                    {
                      name: 'Pawn',
                      type: 'Path',
                      open: false,
                      elt: {},
                      depth: 2,
                      selected: false,
                      children: []
                    },
                  ]
                },
              ]
            },
          ],
        },
        {
          name: 'Blue',
          type: 'Layer',
          open: false,
          elt: {},
          depth: 0,
          selected: false,
          children: []
        },
      ],
      selection: [],
      msg: 'hello world',
      target: {},
      menuList: [],
      findFirst: false,
    }
  },
  mounted() {
    Event.$on('checkSelection', this.checkSelection);
    Event.$on('navigate', this.navigatorControl);
    this.updateMenuList();
    this.$root.selectionList = [this.tree[0]];
  },
  methods: {
    navigatorControl(msg) {
      this.updateMenuList();
      if ((this.$root.addToSelection) && (/down/i.test(msg)))
        this.findFirst = false;
      else
        this.findFirst = true;
      this.getSelection();
      if (/right|left/i.test(msg)) {
        if (/right/i.test(msg))
          this.navigateFold(true);
        else
          this.navigateFold(false);
      } else {
        if (/up/i.test(msg))
          this.navigateNS(-1, msg);
        else
          this.navigateNS(1, msg);
      }
    },
    navigateFold(val) {
      // If this is a folder and has children, fold or unfold it
      if (this.$root.selectionTarget.children.length) {
        if ((!this.$root.selectionTarget.open) && (!val)) {
          // navigate to parent unless at top-level
          if (this.$root.selectionTarget.depth > 0) {
            Event.$emit('updateAnno', `Navigate to parent`);
            this.navigateToParent();
          } else {
            Event.$emit('updateAnno', `Can't navigate higher`);
          }          
        } else if ((this.$root.selectionTarget.open) && (val)) {
          // navigate to first child
          Event.$emit('updateAnno', `Navigate to first child`);
          this.setSelectionByElt(this.tree, this.$root.selectionTarget.children[0].elt);
        } else {
          // close
          Event.$emit('updateAnno', `${this.$root.selectionTarget.name} open = ${val}`);
          this.$root.selectionTarget.open = val;
        }
      } else {
        if (!val) {
          if (this.$root.selectionTarget.depth > 0)
            Event.$emit('updateAnno', `Navigate to parent`);
          else
            Event.$emit('updateAnno', `Can't navigate higher`);
          // If this is a child and has depth, navigate to it's parent on Left
          this.navigateToParent();
        } else {
          Event.$emit('updateAnno', `Can't unfold empty layer`);
        }
      }
    },
    navigateToParent() {
      this.findParentOfElt(this.tree, this.$root.selectionTarget.elt);
      if (this.$root.selectionParent.name == null) {
        // console.log(`At root`)
      } else {
        Event.$emit('clearSelection');
        this.setSelectionByElt(this.tree, this.$root.selectionParent.elt);
      }
    },
    findParentOfElt(list, elt) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if ((item.open) && (item.children.length)) {
          for (let v = 0; v < item.children.length; v++) {
            let child = item.children[v];
            if (child.elt == elt) {
              if (child.depth > 0) {
                this.$root.selectionParent = item;
                return item;
              } else {
                this.$root.selectionParent = null;
                return null;
              }
            } else if ((child.children.length) && (child.open)) {
              this.findParentOfElt(item.children, elt);
            }
          }
        }
      }
    },
    // Something is wrong with Sublayer 1, won't add selection beyond it.
    // This should deselect objects as you hold shift and target something already in selection
    navigateNS(val, dir) {
      // Navigate the chronological order of currently displayed menu-items
      let index = this.findIndexOfSelection();
      let result = index + val;
      let isAdding = this.$root.isAddToSelection;
      if (!isAdding) 
        Event.$emit('clearSelection');
      if ((index + val >= 0) && (index + val < this.menuList.length)) {
        // Standard movement within list
        if (!isAdding)
          Event.$emit('updateAnno', `Move ${dir} from ${this.$root.selectionTarget.name}`);
        this.setSelectionByElt(this.tree, this.menuList[result], isAdding);
      } else {
        if (index + val >= 0) {
          // Reset to top of list
          if (!isAdding)
            Event.$emit('updateAnno', `Reset to top of list`);
          this.setSelectionByElt(this.tree, this.menuList[0], isAdding);
        } else {
          // Reset to bottom of list
          if (!isAdding)
            Event.$emit('updateAnno', `Reset to bottom of list`);
          this.setSelectionByElt(this.tree, this.menuList[this.menuList.length - 1], isAdding);
        }
      }
    },
    setSelectionByElt(list, elt, isAdding=false) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.elt == elt) {
          item.selected = true;
          if (isAdding) {
            // console.log(item.name);
            Event.$emit('updateAnno', `Adding ${item.name} to selection`)
            this.$root.addToSelection(item, 'back', false);
          } else {
            this.$root.selectionList = [item];
          }
        } else {
          if (!isAdding)
            item.selected = false;
          if (item.children.length)
            this.setSelectionByElt(item.children, elt, isAdding);
        }
      }
    },
    findIndexOfSelection() {
      this.updateMenuList();
      for (let i = 0; i < this.menuList.length; i++) {
        const elt = this.menuList[i];
        if (elt === this.$root.selectionTarget.elt)
        return i;
      }
    },
    updateMenuList() { this.menuList = document.querySelectorAll('.menu-wrap'); },
    checkSelection() {
      this.getSelection();
      Event.$emit(`updateAnno`, `Clicked on ${this.$root.selectionTarget.name}`);
    },
    getSelection() { return this.findSelection(this.tree); },
    findSelection(list) {
      // if findFirst, check from top to bottom
      if (this.findFirst) {
        for (let i = 0; i < list.length; i++) {
          const branch = list[i];
          if (branch.selected) {
            this.$root.selectionTarget = branch;
            return branch;
          } else {
            if ((branch.open) && (branch.children.length))
              this.findSelection(branch.children);
          }
        }
      } else {
        // else check from bottom to top
        for (let i = list.length - 1; i >= 0; i--) {
          const branch = list[i];
          if (branch.selected) {
            this.$root.selectionTarget = branch;
            return branch;
          } else {
            if ((branch.open) && (branch.children.length))
              this.findSelection(branch.children);
          }
        }
      }
    }
  }
})

Vue.component('annotation', {
  template: `
    <div class="anno">
      <div class="anno-label">
        {{anno}}
      </div>
    </div>
  `,
  computed: {
    anno: function() {
      return this.$root.annotation;
    }
  }
})

Vue.component('event-manager', {
  template: `
    <div v-keydown-outside="onKeyDownOutside"></div>
  `,
  methods: {
    onKeyDownOutside(evt) {
      if (/arrow/i.test(evt.key)) {
        if (evt.shiftKey)
          this.$root.isAddToSelection = true;
        else
          this.$root.isAddToSelection = false;
        Event.$emit('navigate', evt.key.substring(5, evt.key.length))
      }
    },
  }
})

Vue.component('menu-list', {
  props: {
    list: Array,
  },
  template: `
    <li class="menu-main">
      <menu-item v-for="(menu, index) in list" :key="index" :model="menu" />
    </li>
  `,
})

Vue.component('menu-item', {
  props: {
    model: Object,
  },
  template: `
    <li class="menu-bounds">
      <div class="menu-wrap" :style="getMenuStyle()" @click="onSelection">
        <menu-tab v-for="(tab,key) in depth" :key="key" />
        <div @click="toggleOpen">
          <toggle-icon :model="model" />
        </div>
        <div class="menu-item-label">{{model.name}}</div>
      </div>
      <menu-item-children v-if="model.open && model.children.length" :list="model.children" />
    </li>
  `,
  data() {
    return {
      depth: [],
    }
  },
  computed: { hasChildren: function () { return (/group|layer/i.test(this.model.type)) ? (this.model.children.length) ? true : false : false; }, },
  mounted() {
    this.buildDepth();
    this.model.elt = this.$el.children[0];
    Event.$on('clearSelection', this.clearSelection);
  },
  methods: {
    clearSelection() { this.model.selected = false; },
    onSelection(e) {
      // console.log(e);
      if ((!e.shiftKey) && (!this.model.selected)) {
        if (!this.$root.isAddToSelection)
          Event.$emit('clearSelection');
        this.model.selected = true;
      }
      Event.$emit('checkSelection');
    },
    getMenuStyle() {
      if (this.model.selected)
        return `border: 2px solid ${this.$root.getCSS('color-blue-500')}`;
      else
        return `border: 2px solid transparent;`
    },
    toggleOpen() {
      if (this.model.children.length) {
        this.model.open = !this.model.open;
        Event.$emit('updateAnno', `Manually toggled ${this.$root.selectionTarget.name}`);
      }
    },
    buildDepth() {
      let mirror = [];
      this.depth = [];
      for (let i = 0; i < this.model.depth; i++)
        mirror.push({ key: i })
      this.depth = mirror;
    },
  }
})

Vue.component('menu-item-children', {
  props: {
    list: Array,
  },
  template: `
    <div class="menu-child">
      <menu-item v-for="(menu, index) in list" :key="index" :model="menu">
        <menu-item-children v-if="menu.open && menu.children.length" :list="menu.children" />
      </menu-item>
    </div>
  `,
})

Vue.component('menu-tab', {
  template: `
    <div style="width:2rem;"></div>
  `
})

Vue.component('toggle-icon', {
  props: {
    model: Object,
  },
  template: `
    <div class="toggle-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path v-if="hasChildren && !model.open" class="layer-icon-contents" :style="getSVGStyle()" d="M4.56,16.53a1,1,0,0,1-.64-.23,1,1,0,0,1-.13-1.41L8.11,9.72,3.83,5.15A1,1,0,0,1,5.29,3.78L9.72,8.51a1.77,1.77,0,0,1,.06,2.33L5.33,16.17A1,1,0,0,1,4.56,16.53Zm3.7-6.66h0Z"/>
        <path v-if="hasChildren && model.open" class="layer-icon-contents" :style="getSVGStyle()" d="M3.47,9.07a1,1,0,0,1,.23-.64A1,1,0,0,1,5.11,8.3l5.17,4.32,4.57-4.28A1,1,0,0,1,16.22,9.8l-4.73,4.43a1.77,1.77,0,0,1-2.33.06L3.83,9.84A1,1,0,0,1,3.47,9.07Zm6.66,3.7h0Z"/>
      </svg>
    </div>
  `,
  computed: {
    hasChildren: function () {
      if (/group|layer/i.test(this.model.type)) {
        if (/layer/i.test(this.model.type)) 
          return true;
        else
          return (this.model.children.length) ? true : false;
      }
      else
        return false;
    },
    iconColor: function () { return `fill: ${this.$root.getCSS('color-icon')}` }
  },
  methods: {
    getSVGStyle() { return `width: ${this.$root.getCSS('icon-height')};${this.iconColor};`; },
  }
})

var app = new Vue({
  el: '#app',
  data: {
    isAddToSelection: false,
    selectionTarget: {},
    selectionParent: {},
    selectionList: [],
    annotation: 'Render menu',
  },
  mounted() {
    Event.$on('updateAnno', this.updateAnno);
  },
  methods: {
    updateAnno(msg) {
      this.annotation = msg;
    },
    addToSelection(item, side, removing) {
      // side = side||'back';
      // removing = removing||false;
      let err = -1;
      for (let i = this.selectionList.length; i <= 0; i--) {
        console.log(i)
        const selected = this.selectionList[i];
        if (selected.elt === item.elt)
          err = i;
      }
      if (err < 0) {
        if (!removing) {
          console.log('Appending object')
          if (/bottom|back/i.test(side))
            this.selectionList.push(item)
          else
            this.selectionList.unshift(item)
        }
      } else {
        console.log('Removing object')
        this.selectionList.splice(err, 1);
      }
      console.log(this.selectionList);
    },
    getCSS(prop) { return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop); },
    setCSS(prop, data) { document.documentElement.style.setProperty('--' + prop, data); },
  }
})