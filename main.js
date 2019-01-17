window.Event = new Vue();

Vue.component('sandbox', {
  template: `
    <div class="body-wrap">
      <event-manager />
      <menu-list :list="tree" />
    </div>
  `,
  data() {
    return {
      tree: [
        {
          name: 'Layer 1',
          type: 'Layer',
          open: false,
          elt: {},
          depth: 0,
          selected: true,
          children: [
            {
              name: 'Sublayer 1',
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
                  name: 'Bishop',
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
              name: 'Group Item',
              type: 'Group',
              open: false,
              elt: {},
              depth: 1,
              selected: false,
              children: []
            },
            {
              name: 'Sublayer 3',
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
          name: 'Layer 2',
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
    }
  },
  mounted() {
    Event.$on('checkSelection', this.checkSelection);
    Event.$on('navigate', this.navigatorControl);
    this.updateMenuList();
  },
  methods: {
    navigatorControl(msg) {
      this.updateMenuList();
      this.getSelection();
      if (/right|left/i.test(msg)) {
        if (/right/i.test(msg))
          this.navigateFold(true);
        else
          this.navigateFold(false);
      } else {
        if (/up/i.test(msg))
          this.navigateNS(-1);
        else
          this.navigateNS(1);
      }
    },
    navigateFold(val) {
      // If this is a folder and has children, fold or unfold it
      if (this.$root.selectionTarget.children.length)
        this.$root.selectionTarget.open = val;
    },
    navigateNS(val) {
      // Navigate the chronological order of currently displayed menu-items
      let index = this.findIndexOfSelection();
      let result = index + val;
      let isAdding = this.$root.isAddToSelection;
      if (!isAdding) 
        Event.$emit('clearSelection');
      if ((index + val >= 0) && (index + val < this.menuList.length)) {
        // Standard movement within list
        this.setSelectionByElt(this.tree, this.menuList[result], isAdding);
      } else {
        if (index + val >= 0) {
          // Reset to top of list
          this.setSelectionByElt(this.tree, this.menuList[0], isAdding);
        } else {
          // Reset to bottom of list
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
            console.log(isAdding)
            // this.$root.addToSelection(item);
          }
          else
            this.$root.selectionList = [item];
        } else {
          if (!isAdding)
            item.selected = false;
          if (item.children.length)
            this.setSelectionByElt(item.children, elt, isAdding);
        }
      }
    },
    updateMenuList() { this.menuList = document.querySelectorAll('.menu-wrap'); },
    findIndexOfSelection() {
      this.updateMenuList();
      for (let i = 0; i < this.menuList.length; i++) {
        const elt = this.menuList[i];
        if (elt === this.$root.selectionTarget.elt)
          return i;
      }
    },
    checkSelection() {
      let selection = this.getSelection();
      console.log(`Checked selection is ${selection.name}`);
    },
    getSelection() {
      return this.findSelection(this.tree);
    },
    findSelection(list) {
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
    }
  }
})

Vue.component('event-manager', {
  template: `
    <div 
      v-keydown-outside="onKeyDownOutside"
      v-keyup-outside="onKeyUpOutside">
    </div>
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
    onKeyUpOutside(evt) {
      // console.log(evt)
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
  mounted() {
    console.log(this.list)
  }
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
      if (this.model.children.length)
        this.model.open = !this.model.open;
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
    selection: {},
    selectionList: [],
  },
  methods: {
    addToSelection(item, side='back', removing=false) {
      let err = -1;
      for (let i = this.selectionList.length; i <= 0; i--) {
        const selected = this.selectionList[i];
        if (selected == item)
          err = i;
      }
      if (err >= 0) {
        if (!removing) {
          console.log('Appending object')
          if (/bottom|back/i.test(side))
            this.selectionList.push(item)
          else
            this.selectionList.unshift(item)
        } else {
          console.log('Removing object')
          this.selectionList.splice(err, 1);
        }
      } else {
        console.log(`${item.name} was already in selection`);
      }
      console.log(this.selectionList);
    },
    getCSS(prop) { return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop); },
    setCSS(prop, data) { document.documentElement.style.setProperty('--' + prop, data); },
  }
})