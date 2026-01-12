<script setup>
import { ref, computed, onMounted, render } from 'vue';
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net';
import Switch from '@/components/Switch.vue';

// 讓 Vue 組件能夠使用 DataTables 核心功能
DataTable.use(DataTablesCore);

const status = ref(false);

// 定義表格欄位：data 必須完全對應 JSON 裡的 Key
const columns = [
  { data: 'USER_ID', title: '編號'},
  { data: 'USER_NAME', title: '姓名' },
  { data: 'USER_EMAIL', title: '信箱' },
  { data: 'USER_STARTDATE', title: '加入日期' },
  {
  data: 'IS_ACTIVE',
  title: '狀態',
  render: (data, type, row) => {
    const checked = data ? 'checked' : '';
    return `
      <label class="dt-switch">
        <input type="checkbox" ${checked} data-id="${row.USER_ID}">
        <span class="dt-slider"></span>
        <span class="dt-label">${data ? '啟用' : '停權'}</span>
      </label>
    `;
  }
}
];

// DataTables 的詳細設定
const dtOptions = {
  // 重點：因為你的 JSON 是純陣列，所以 dataSrc 要設為空字串
  ajax: {
    url: '/data/user/users.json',
    dataSrc: '' 
  },
  columnDefs: [
    {
      targets: '_all',
      className: 'dt-head-left dt-body-center' // 套用到所有表頭
    }
  ],
  pageLength: 5,
  lengthChange: false,
  language: {
    info: "總共 _TOTAL_ 筆資料，顯示第 _START_ 到 _END_ 筆",
    infoEmpty: "沒有資料",
    search: "",
    searchPlaceholder: "尋找...",
    zeroRecords: "找不到符合的資料",
    // paginate: {
    //   next: "下一頁",
    //   previous: "上一頁"
    // }
  }
};
</script>



<template>
  <div class="datatable-content">
    <DataTable 
      :columns="columns" 
      :options="dtOptions"
      class="display" 
      width="100%"
    >
    </DataTable>
  </div>
</template>


<style lang="scss">
    /* 隱藏 DataTables 預設的排序圖示 (包含偽元素 ::before 和 ::after) */
@import 'datatables.net-dt';


//外框
.test table.dataTable {
  overflow: hidden;
  border-top: 1px solid #838383;
  border-left: 1px solid #838383;
  border-right: 1px solid #838383;
}

/* 表頭 */
table.dataTable thead th {
  background: #E3F3DD;
  text-align: center !important;
  font-size: 16px;
  font-weight: normal;
}

//搜尋
.datatable-content .dt-search input {
  border-radius: 50px !important;
  padding: 6px 10px !important;
  padding: 10px 20px 10px 40px !important;
  color: #77a48d !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 18px;
}
.datatable-content .dt-search input::placeholder {
  color: #77a48d;
  opacity: 0.7;
}


//排序按鈕的中間距離
.dt-column-order::after {
  margin-top: 3px
}

/* 按鈕 */
div.dt-container .dt-paging .dt-paging-button,
.dataTables_wrapper .dataTables_paginate .paginate_button {
  // background: #ffffffff !important;
  border-radius: 10px;
  box-sizing: border-box;
  color: #3E8D60 !important;
  border: 1px solid #3E8D60 !important;
  height: 40px;
  width: 40px;
  padding: 0px !important;
  margin-left: 10px !important;

}
div.dt-container .dt-paging .dt-paging-button:hover,
.dataTables_wrapper .dataTables_paginate .paginate_button:hover {
  background: #3E8D60 !important;
  color: white !important;
}
div.dt-container .dt-paging .dt-paging-button.current,
.dataTables_wrapper .dataTables_paginate .paginate_button.current {
  background: #3E8D60 !important;
  color: white !important;
  /* border-color: #3E8D60 !important; */
}




//switch
.dt-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.dt-switch input {
  display: none;
}

.dt-slider {
  width: 40px;
  height: 20px;
  background: #dcdfe6;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s;
}

.dt-slider::before {
  content: '';
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.dt-switch input:checked + .dt-slider {
  background: #409eff;
}

.dt-switch input:checked + .dt-slider::before {
  transform: translateX(20px);
}
</style>