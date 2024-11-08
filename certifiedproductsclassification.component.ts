import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';
import { NgForm } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { Route, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { getFileClassName } from '../../../../../public/assets/suite_gpl/codebase/types/ts-vault/sources/helper';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-certifiedproductsclassification',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './certifiedproductsclassification.component.html',
  styleUrl: './certifiedproductsclassification.component.scss'
})
export class CertifiedproductsclassificationComponent {


  @ViewChild('modal', { static: false }) modal!: ElementRef; // Do not set static to true
  @ViewChild('modalHeader', { static: false }) modalHeader!: ElementRef; // Do not set static to true

  ngAfterViewChecked(): void {
    //Called after every check of the component's view. Applies to components only.
    //Add 'implements AfterViewChecked' to the class.
    if (this.isOpenCertifedAdd || this.isOpenCertifedEdit) {
      this.authService.makeModalDraggable(this.modal.nativeElement, this.modalHeader.nativeElement);
    }
  }


  private apiUrl = environment.apiUrl;
  loading = false
  certifiedForm: FormGroup;
  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router, public authService: AuthService) {

    this.certifiedForm = this.fb.group({

      certified_products_classification_code: ['', [
        Validators.required,
        Validators.pattern('^[0-9]+$') // Allows only digits from 0 to 9
      ]],
      fire_grouping: ['', Validators.required],
      material_grouping: ['', Validators.required],
      certified_products_classification_name: '',
      certified_products_main_material: ['', Validators.required],
      certified_products_decorative_layer: ['', Validators.required],
      certified_products_backing_material: ['', Validators.required],
      flame_proof_finish: ['', Validators.required],
      construction_method: ['', Validators.required],
      fire_performance_fireproof_undercoat: '',
      fire_performance_fireproof_plaster: '',
      fire_performance_quasi_incombustible: '',
      fire_performance_metal: '',


    });
  }

  errorMessage: string | null = null;
  async certifiedSubmit() {
    if (this.certifiedForm.invalid) {
      this.certifiedForm.markAllAsTouched();
      return;
    }
    if (this.certifiedForm.valid) {


      try {
        const response = await this.authService.addCertifiedApi(this.certifiedForm.value)
        if (response && response.message) {
          alert(response.message)
          this.certifiedForm.reset()
        }
        this.doSearch()

        this.isOpenCertifedAdd = false

      } catch (err) {
        this.errorMessage = null;
        if (err instanceof HttpErrorResponse) {
          if (err.status === 400 && err.error && err.error.error) {
            alert(err.error.error);
            this.errorMessage = err.error.error;
            this.certifiedForm.get('certified_products_classification_code')?.setErrors({ apiError: true });
          } else {
            alert("システムエラーです");
          }
        } else {
          alert("システムエラーです");
        }

      }


    }

  }

  companyData: any[] = []


  async ngOnInit() {

    this.companyData = await this.fetchCompanyData();


  }

  initializeDropdown(): void {

  }
  showSubMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const subMenu = target.querySelector('ul');
    if (subMenu) {
      subMenu.style.display = 'block';
    }
  }

  hideSubMenu(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const subMenu = target.querySelector('ul');
    if (subMenu) {
      subMenu.style.display = 'none';
    }
  }

  // --------------------Excel Export-----------------------------
  fncExcelExport() {
    const confirmExport = window.confirm("一括出力しますか？");
  
    if (confirmExport) {
      if (this.certifiedList.length === 0) {
        // Call API and get all data and create excel
        this.doSearch().then(() => {
          this.exportToExcel(this.certifiedList);
        });
      } else {
        this.exportToExcel(this.certifiedList);
      }
    }
  }

  private exportToExcel(data: any[]) {
    // Step 1: Map the certifiedList to rename the columns
    const mappedData = data.map(item => {
      let fireproof_undercoatValue = '';
      let fireproof_plasterValue = '';
      let construction_methodValue = '';
      let flame_proofValue = '';
      let material_groupingValue = '';
      let fire_performance_quasiValue = '';
      let fire_performance_metalValue = '';
      // Handle the "不燃石膏" (fire performance fireproof undercoat) field based on conditions
      if (item.material_grouping == 1) {
        material_groupingValue = '紙系壁紙';
      } else if (item.material_grouping == 2) {
        material_groupingValue = '繊維系壁紙';
      } else if (item.material_grouping == 3) {
        material_groupingValue = '塩化ビニル樹脂系壁紙';
      } else if (item.material_grouping == 4) {
        material_groupingValue = 'プラスチック系壁紙';
      } else if (item.material_grouping == 5) {
        material_groupingValue = '無機質系壁紙';
      } else if (item.material_grouping == 6) {
        material_groupingValue = 'その他壁紙';
      } else {
        material_groupingValue = '選択してください';
      }
      //-------------------------
      if (item.construction_method == 1) {
        construction_methodValue = '標準施工法';
      } else if (item.construction_method == 2) {
        construction_methodValue = '標準施工法タック';
      } else if (item.construction_method == 3) {
        construction_methodValue = '条件付施工法';
      } else if (item.construction_method == 4) {
        construction_methodValue = '特有の施工法';
      } else if (item.construction_method == 5) {
        construction_methodValue = '（空白';
      } else {
        construction_methodValue = '選択してください';
      }
      //-------------------------
      if (item.flame_proof_finish == 1) {
        flame_proofValue = 'あり';
      } else if (item.flame_proof_finish == 2) {
        flame_proofValue = 'なし';
      } else if (item.flame_proof_finish == 3) {
        flame_proofValue = 'ありまたはなし';
      } else {
        flame_proofValue = '選択してください';
      }
      //-------------------------
      if (item.fire_performance_fireproof_undercoat == 1) {
        fireproof_undercoatValue = '不燃';
      } else if (item.fire_performance_fireproof_undercoat == 2) {
        fireproof_undercoatValue = '準不燃';
      } else if (item.fire_performance_fireproof_undercoat == 3) {
        fireproof_undercoatValue = '難燃';
      } else {
        fireproof_undercoatValue = '';
      }
      //-------------------------
      if (item.fire_performance_fireproof_plaster == 1) {
        fireproof_plasterValue = '不燃';
      } else if (item.fire_performance_fireproof_plaster == 2) {
        fireproof_plasterValue = '準不燃';
      } else if (item.fire_performance_fireproof_plaster == 3) {
        fireproof_plasterValue = '難燃';
      } else {
        fireproof_plasterValue = '';
      }
      //-------------------------
      if (item.fire_performance_quasi_incombustible == 1) {
        fire_performance_quasiValue = '不燃';
      } else if (item.fire_performance_quasi_incombustible == 2) {
        fire_performance_quasiValue = '準不燃';
      } else if (item.fire_performance_quasi_incombustible == 3) {
        fire_performance_quasiValue = '難燃';
      } else {
        fire_performance_quasiValue = '';
      }
      //-------------------------
      if (item.fire_performance_metal == 1) {
        fire_performance_metalValue = '不燃';
      } else if (item.fire_performance_metal == 2) {
        fire_performance_metalValue = '準不燃';
      } else if (item.fire_performance_metal == 3) {
        fire_performance_metalValue = '難燃';
      } else {
        fire_performance_metalValue = '';
      }
      // Return the mapped object
      return {
        "認定コード": item.certified_products_classification_code,
        "防火種別": item.fire_grouping,
        "材料区分": material_groupingValue,
        "主素材": item.certified_products_main_material,
        "化粧層": item.certified_products_decorative_layer,
        "裏打材": item.certified_products_backing_material,
        "難燃処理": flame_proofValue,
        "施工法": construction_methodValue,
        "不燃下地": fireproof_undercoatValue,
        "不燃石膏": fireproof_plasterValue,
        "準不燃": fire_performance_quasiValue,
        "金属": fire_performance_metalValue,
        "名称": item.certified_products_classification_name
      };
    });

    // Step 2: Create a new worksheet with renamed columns
    const ws = XLSX.utils.json_to_sheet(mappedData);

    // Step 3: Create a new workbook and append the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certified List");

    // date time format
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, ""); // "HHMMSS"
    const fileName = `${formattedDate}_${formattedTime}.xlsx`;

    // Step 4: Write the workbook to an Excel file and trigger download
    XLSX.writeFile(wb, fileName);
  }
  // -------------------window show------------------------------
  private dhxwindow: any;

  ngAfterViewInit(): void {
    this.initializeWindow();
  }

  initializeWindow(): void {

  }

  fcnShowonetimecode(): void {
    this.dhxwindow.show();
  }

  certifiedAdd() {

    this.isOpenCertifedAdd = true


  }
  isOpenCertifedEdit = false
  certifiedEdit() {

    if (this.selectedIndex === null) {
      alert("選択してください")
      return
    }

    this.isOpenCertifedEdit = true

  }
  company_code_select: string = ''
  certified_products_classification_code: string = ''
  fire_grouping: string = ''
  material_grouping: string = ''
  construction_method: string = ''
  certified_products_classification_name: string = ''
  certifiedList: any[] = []

  currentPage: number = 1;
  totalPages: any = '';
  pages: number[] = []
  async doSearch(page: number = 1, limit: number = 100) {

    if (page == 1) {
      this.currentPage = 1
    }


    // const company_code = this.company_code_select ? this.company_code_select : this.company_code;
    // // Check if both values are filled and different
    // if (this.company_code && this.company_code_select && this.company_code !== this.company_code_select) {
    //   alert('The entered company code and selected company code do not match.');
    //   return; // Exit the function if they are not the same
    // }
    this.selectedIndex = null
    this.certifiedList = []
    this.pages = []

    try {
      this.loading = true
      const response = await this.authService.fetchCertifiedApi(page, limit, this.certified_products_classification_code, this.fire_grouping, this.material_grouping, this.construction_method, this.certified_products_classification_name);

      this.certifiedList = response;

      this.totalPages = Math.ceil(response[0]['total_count'] / limit);
      this.generatePageNumbers()
      this.loading = false

    } catch (err) {

      alert("検索結果はありません")
      this.loading = false
    }

  }

  maxVisiblePages = 5
  generatePageNumbers(): void {

    const startPage = Math.max(this.currentPage - Math.floor(this.maxVisiblePages / 2), 1);
    const endPage = Math.min(startPage + this.maxVisiblePages - 1, this.totalPages);

    this.pages = [];
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.doSearch(this.currentPage);
  }
  selectedIndex: number | null = null;
  selectedData: any = null
  isOpenCertifedAdd = false
  selectRow(index: number) {

    if (this.selectedIndex === index) {
      // Deselect the row if it is already selected
      this.selectedIndex = null;
    } else {
      // Select the new row
      this.selectedIndex = index;

      this.selectedData = this.certifiedList[index]

    }

  }

  async certifiedEditForm(form: NgForm) {

    if (form.valid) {
      const updatedData = form.value;

      try {
        const response = await this.authService.updateCertifiedApi(this.selectedData.document_id, updatedData);

        if (response && response.message) {
          alert(response.message)
        }
        this.isOpenCertifedEdit = false
        this.doSearch()

      } catch (err) {

        if (err instanceof HttpErrorResponse) {
          if (err.status === 400 && err.error && err.error.error) {
            alert(err.error.error);

          } else {
            alert("システムエラーです");
          }
        } else {
          alert("システムエラーです");
        }
      }

    }

  }

  async deleteUser(document_id: string) {

    let message = "連動して下記情報も削除されますがよろしいでしょうか?\n" + "防火認定番号情報\n" + "JIS認証番号\n" + "大臣認定番号\n" + "一部商品情報"
    if (confirm(message)) {

      try {

        const response = await this.authService.deleteCertifiedApi(this.selectedData.document_id)
        if (response && response.message) {
          alert(response.message)
        }
        this.isOpenCertifedEdit = false
        this.doSearch()


      } catch (err) {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 400 && err.error && err.error.error) {
            alert(err.error.error);

          } else {
            alert("システムエラーです");
          }
        } else {
          alert("システムエラーです");
        }
      }

    }
  }
  close() {

    this.isOpenCertifedAdd = false
    this.isOpenCertifedEdit = false
    this.certifiedForm.reset()

  }
  logout() {

    this.authService.logout();
  }


  private async fetchCompanyData(): Promise<any[]> {
    const companyUrl = `${this.apiUrl}/api/company_lists`;
    return firstValueFrom(this.http.get<any[]>(companyUrl));
  }
}
