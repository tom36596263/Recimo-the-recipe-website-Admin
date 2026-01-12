<script setup>
import { ref, onMounted} from 'vue';
// 從套件中導入你需要的圖示
import { Edit } from '@element-plus/icons-vue'
// 1. 定義一個響應式變數來存資料
const tableData = ref([])

// 2. 寫一個函式去抓資料
const loadJsonData = async () => {
  try {
    // 直接 fetch 相對路徑（注意：不用寫 public，直接從 / 開始）
    const response = await fetch('/data/user/users.json')
    const data = await response.json()
    
    // 3. 把抓到的資料塞給表格
    tableData.value = data
    console.log(data);
    
  } catch (error) {
    console.error('抓取 JSON 失敗:', error)
  }
}

// 4. 當畫面掛載完成後執行
onMounted(() => {
  loadJsonData()
  
})

const handleStatusChange = (row) => {
  console.log('當前這筆資料的 ID:', row.id); // 假設你的資料有 id
  console.log('新的狀態值是:', row.status); 
  
  // 這裡通常會呼叫 API 把新狀態存回資料庫
  // updateStatusApi(row.id, row.status).then(...)
};

</script>


<template>
  <div style="padding: 20px">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <el-select v-model="category" placeholder="全部">
        <el-option label="蔬菜" value="vegetable" />
        <el-option label="肉類" value="meat" />
      </el-select>
      
      <!-- <div style="display: flex; gap: 10px"> -->
        <el-button type="success">新增食材</el-button>
        <!-- <el-input v-model="search" placeholder="搜尋..." style="width: 200px" /> -->
      <!-- </div> -->
    </div>

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="USER_ID" label="會員編號" sortable />
      <el-table-column prop="USER_NAME" label="姓名" sortable />
      <el-table-column prop="USER_EMAIL" label="電子信箱" />
      <el-table-column prop="USER_STARTDATE" label="加入日期" sortable/>
      
      <el-table-column label="狀態">
       <!-- <el-switch 
            v-model="scope.row.status" 
            active-text="上架" 
            @change="handleStatusChange(scope.row)" 
        /> -->
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB"
            active-text="啟用"
            inactive-text="停權"
            @change="handleStatusChange(scope.row)"
        />
        </template>
      </el-table-column>

      <el-table-column label="詳情">
        <template #default>
          <el-button link type="primary">
            <el-icon>
            <Edit />
            </el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination 
      layout="prev, pager, next" 
      :total="50" 
      style="margin-top: 20px; justify-content: flex-end" 
    />
  </div>
</template>

<style>
    .el-switch-on-color{
        background-color: #fff;
    }
</style>