<script setup>
import { ref } from 'vue';
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net';

// 讓 Vue 組件能夠使用 DataTables 核心功能
DataTable.use(DataTablesCore);

// 定義表格欄位：data 必須完全對應 JSON 裡的 Key
const columns = [
  { data: 'USER_ID', title: '編號' },
  { data: 'USER_NAME', title: '姓名' },
  { data: 'USER_EMAIL', title: '信箱' },
  // { data: 'USER_PHONE', title: '電話' },
  { data: 'USER_STARTDATE', title: '加入日期' },
  { 
    data: 'IS_ACTIVE', 
    title: '狀態',
    render: (data) => {
      const color = data ? 'green' : 'red';
      const text = data ? '啟用' : '停權';
      return `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
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
  pageLength: 5,
  lengthChange: false,
  language: {
    info: "總共 _TOTAL_ 筆資料，顯示第 _START_ 到 _END_ 筆",
    infoEmpty: "沒有資料",
    search: "",
    searchPlaceholder: "尋找會員...",
    zeroRecords: "找不到符合的資料",
    // paginate: {
    //   next: "下一頁",
    //   previous: "上一頁"
    // }
  }
};
</script>

<template>
  <div class="test">
    <h1>會員管理</h1>
    
    <DataTable 
      :columns="columns" 
      :options="dtOptions"
      class="display" 
      width="100%"
    >
      <!-- <thead>
        <tr>
          <th>編號</th>
          <th>姓名</th>
          <th>信箱</th>
          <th>電話</th>
          <th>加入日期</th>
          <th>狀態</th>
        </tr>
      </thead> -->
    </DataTable>
  </div>
</template>

<style lang="scss">
/* 隱藏 DataTables 預設的排序圖示 (包含偽元素 ::before 和 ::after) */
@import 'datatables.net-dt';
.dt-column-order::after {
  /* display: none !important; */
  margin-top: 3px
}

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

#dt-search-0 {
  border-radius: 50px !important;
  padding: 6px 10px !important;
  padding: 10px 20px 10px 40px !important;
  color: #77a48d !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 18px;
}

#dt-search-0::placeholder {
  color: #77a48d;
  opacity: 0.7;
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
//  lang="scss": 告訴 Vue 這裡要用 Scss 編譯
//  scoped: 確保這裡寫的 CSS 只會影響目前這個頁面，不會「跑去污染」到其他頁面的樣式。

</style>