import {Utils as _} from "../utils";
import {GridOptionsWrapper} from "../gridOptionsWrapper";
import {Autowired} from "../context/context";
import {RowComp} from "./rowComp";

export interface RowContainerComponentParams {
    eContainer: HTMLElement;
    eViewport?: HTMLElement;
    hideWhenNoChildren?: boolean;
}

/**
 * There are many instances of this component covering each of the areas a row can be entered
 * eg body, pinned left, fullWidth. The component differs from others in that it's given the
 * elements, there is no template. All of the elements are part of the GridPanel.
 */
export class RowContainerComponent {

    private eContainer: HTMLElement;
    private eViewport: HTMLElement;

    private hideWhenNoChildren: boolean;
    private childCount = 0;
    private visible: boolean;

    private rowTemplatesToAdd: string[] = [];
    private afterGuiAttachedCallbacks: Function[] = [];

    @Autowired('gridOptionsWrapper') gridOptionsWrapper: GridOptionsWrapper;

    constructor(params: RowContainerComponentParams) {
        this.eContainer = params.eContainer;
        this.eViewport = params.eViewport;

        this.hideWhenNoChildren = params.hideWhenNoChildren;

        this.checkVisibility();
    }

    public getRowElement(rowId: string): HTMLElement {
        let res = <HTMLElement> this.eContainer.querySelector(`[row="${rowId}"]`);
        return res;
    }

    public setHeight(height: number): void {
        this.eContainer.style.height = height + "px";
    }

    public appendRowElement(eRow: HTMLElement, eRowBefore: HTMLElement, ensureDomOrder: boolean): void {
        if (ensureDomOrder) {
            _.insertWithDomOrder(this.eContainer, eRow, eRowBefore);
        } else {
            this.eContainer.appendChild(eRow);
        }
        this.afterRowAdded();
    }

    public flushRowTemplates(): void {
        if (this.rowTemplatesToAdd.length===0) { return; }

        let htmlToAdd = this.rowTemplatesToAdd.join('');
        _.appendHtml(this.eContainer, htmlToAdd);

        this.rowTemplatesToAdd.length = 0;

        this.afterGuiAttachedCallbacks.forEach( func => func() );
        this.afterGuiAttachedCallbacks.length = 0;
    }

    private afterRowAdded(): void {
        // it is important we put items in in order, so that when we open a row group,
        // the new rows are inserted after the opened group, but before the rows below.
        // that way, the rows below are over the new rows (as dom renders last in dom over
        // items previous in dom), otherwise the child rows would cover the row below and
        // that meant the user doesn't see the rows below slide away.
        this.childCount++;
        this.checkVisibility();
    }

    public appendRowTemplateAsync(rowTemplate: string, callback: ()=>void ): void {
        this.rowTemplatesToAdd.push(rowTemplate);
        this.afterGuiAttachedCallbacks.push(callback);
        this.afterRowAdded();
    }

    public appendRowTemplate(rowTemplate: string): HTMLElement {

        _.appendHtml(this.eContainer, rowTemplate);
        this.afterRowAdded();

        return <HTMLElement> this.eContainer.lastChild;
    }

    public ensureDomOrder(eRow: HTMLElement, eRowBefore: HTMLElement): void {
        _.ensureDomOrder(this.eContainer, eRow, eRowBefore);
    }

    public removeRowElement(eRow: HTMLElement): void {
        this.eContainer.removeChild(eRow);
        this.childCount--;
        this.checkVisibility();
    }

    private checkVisibility(): void {
        if (!this.hideWhenNoChildren) { return; }

        let eGui = this.eViewport ? this.eViewport : this.eContainer;
        let visible = this.childCount > 0;

        if (this.visible !== visible) {
            this.visible = visible;
            _.setVisible(eGui, visible);
        }

    }
}
