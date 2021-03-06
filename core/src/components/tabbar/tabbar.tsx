import { Component, Element, Listen, Prop, State, Watch } from '@stencil/core';
import { createThemedClasses } from '../../utils/theme';
import { DomController } from '../../index';

@Component({
  tag: 'ion-tabbar',
  styleUrls: {
    ios: 'tabbar.ios.scss',
    md: 'tabbar.md.scss'
  },
  host: {
    theme: 'tabbar'
  }
})
export class Tabbar {
  mode: string;
  color: string;

  @Element() el: HTMLElement;

  @State() canScrollLeft = false;
  @State() canScrollRight = false;

  @State() hidden = false;

  @Prop({ context: 'dom' }) dom: DomController;
  @Prop() placement = 'bottom';
  @Prop() selectedTab: HTMLIonTabElement;
  @Prop() scrollable: boolean;
  @Prop() tabs: HTMLIonTabElement[];

  private scrollEl: HTMLIonScrollElement;

  @Watch('selectedTab')
  selectedTabChanged() {
    this.scrollable && this.scrollToSelectedButton();
    this.highlight && this.updateHighlight();
  }

  @Prop() layout = 'icon-top';
  @Prop() highlight = false;

  /**
   * If true, the tabbar will be translucent. Defaults to `false`.
   */
  @Prop() translucent = false;

  @Listen('body:keyboardWillHide')
  protected onKeyboardWillHide() {
    setTimeout(() => this.hidden = false, 50);
  }

  @Listen('body:keyboardWillShow')
  protected onKeyboardWillShow() {
    if (this.placement === 'bottom') {
      this.hidden = true;
    }
  }

  @Listen('window:resize')
  onResize() {
    this.highlight && this.updateHighlight();
  }

  @Listen('ionTabButtonDidLoad')
  @Listen('ionTabButtonDidUnload')
  onTabButtonLoad() {
    this.scrollable && this.updateBoundaries();
    this.highlight && this.updateHighlight();
  }

  protected analyzeTabs() {
    const tabs: HTMLIonTabButtonElement[] = Array.from(document.querySelectorAll('ion-tab-button'));
    const scrollLeft = this.scrollEl.scrollLeft;
    const tabsWidth = this.scrollEl.clientWidth;
    let previous: {tab: HTMLIonTabButtonElement, amount: number};
    let next: {tab: HTMLIonTabButtonElement, amount: number};

    tabs.forEach((tab: HTMLIonTabButtonElement) => {
      const left = tab.offsetLeft;
      const right = left + tab.offsetWidth;

      if (left < scrollLeft) {
        previous = {tab, amount: left};
      }

      if (!next && right > (tabsWidth + scrollLeft)) {
        const amount = right - tabsWidth;
        next = {tab, amount};
      }
    });

    return {previous, next};
  }

  private getSelectedButton(): HTMLIonTabButtonElement | undefined {
    return Array.from(this.el.querySelectorAll('ion-tab-button'))
      .find(btn => btn.selected);
  }

  protected scrollToSelectedButton() {
    this.dom.read(() => {
      const activeTabButton = this.getSelectedButton();

      if (activeTabButton) {
        const scrollLeft: number = this.scrollEl.scrollLeft,
          tabsWidth: number = this.scrollEl.clientWidth,
          left: number = activeTabButton.offsetLeft,
          right: number = left + activeTabButton.offsetWidth;

        let amount;

        if (right > (tabsWidth + scrollLeft)) {
          amount = right - tabsWidth;
        } else if (left < scrollLeft) {
          amount = left;
        }

        if (amount !== undefined) {
          this.scrollEl.scrollToPoint(amount, 0, 250).then(() => {
            this.updateBoundaries();
          });
        }
      }
    });
  }

  private scrollByTab(direction: 'left' | 'right') {
    this.dom.read(() => {
      const {previous, next} = this.analyzeTabs(),
        info = direction === 'right' ? next : previous,
        amount = info && info.amount;

      if (info) {
        this.scrollEl.scrollToPoint(amount, 0, 250).then(() => {
          this.updateBoundaries();
        });
      }
    });
  }

  private updateBoundaries() {
    this.canScrollLeft = this.scrollEl.scrollLeft !== 0;
    this.canScrollRight = this.scrollEl.scrollLeft < (this.scrollEl.scrollWidth - this.scrollEl.offsetWidth);
  }

  private updateHighlight() {
    if (!this.highlight) {
      return;
    }
    this.dom.read(() => {
      const btn = this.getSelectedButton();
      const highlight = this.el.querySelector('div.tabbar-highlight') as HTMLElement;
      if (btn && highlight) {
        highlight.style.transform = `translate3d(${btn.offsetLeft}px,0,0) scaleX(${btn.offsetWidth})`;
      }
    });
  }

  hostData() {
    const themedClasses = this.translucent ? createThemedClasses(this.mode, this.color, 'tabbar-translucent') : {};

    return {
      role: 'tablist',
      class: {
        ...themedClasses,
        [`layout-${this.layout}`]: true,
        [`placement-${this.placement}`]: true,
        'tabbar-hidden': this.hidden,
        'scrollable': this.scrollable
      }
    };
  }

  render() {
    const selectedTab = this.selectedTab;
    const ionTabbarHighlight = this.highlight ? <div class='animated tabbar-highlight'/> as HTMLElement : null;
    const buttonClasses = createThemedClasses(this.mode, this.color, 'tab-button');
    const tabButtons = this.tabs.map(tab => <ion-tab-button class={buttonClasses} tab={tab} selected={selectedTab === tab}/>);

    if (this.scrollable) {
      return [
        <ion-button onClick={() => this.scrollByTab('left')} fill='clear' class={{inactive: !this.canScrollLeft}}>
          <ion-icon name='arrow-dropleft'/>
        </ion-button>,

        <ion-scroll forceOverscroll={false} ref={(scrollEl: HTMLIonScrollElement) => this.scrollEl = scrollEl}>
          {tabButtons}
          {ionTabbarHighlight}
        </ion-scroll>,

        <ion-button onClick={() => this.scrollByTab('right')} fill='clear' class={{inactive: !this.canScrollRight}}>
          <ion-icon name='arrow-dropright'/>
        </ion-button>
      ];
    } else {
      return [
        ...tabButtons,
        ionTabbarHighlight
      ];
    }
  }
}
