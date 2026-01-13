<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
// 從套件中導入你需要的圖示
import { Edit } from '@element-plus/icons-vue'
// 1. 定義一個響應式變數來存資料
const tableData = ref([])

// 2. 寫一個函式去抓資料
const loadJsonData = async () => {
  try {
    // axios 會自動將 response 轉為物件，資料就在 .data 屬性裡
    const response = await axios.get('/data/user/users.json')
    
    // 3. 把抓到的資料塞給表格
    tableData.value = response.data
    console.log('取得的資料：', response.data);

  } catch (error) {
    // axios 的錯誤處理更詳細
    console.error('抓取 JSON 失敗:', error.message)
  }
}
// 4. 當畫面掛載完成後執行
onMounted(() => {
  loadJsonData()

})

const handleStatusChange = (row) => {
  console.log('當前這筆資料的 ID:', row.USER_ID); // 修正：你的 JSON 欄位是 USER_ID
  console.log('新的狀態值是:', row.status);
};


</script>

<template>
  <div class="test">
    <h2 class="zh-h2 content-title">會員管理</h2>
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
        <el-table-column prop="USER_STARTDATE" label="加入日期" sortable />

        <el-table-column label="狀態">
          <!-- <el-switch 
            v-model="scope.row.status" 
            active-text="上架" 
            @change="handleStatusChange(scope.row)" 
        /> -->
          <template #default="scope">
            <el-switch v-model="scope.row.status" size="large" class="ml-2" inline-prompt
              style="--el-switch-on-color: #3E8D60; --el-switch-off-color: #ABABAB" active-text="啟用" inactive-text="停權"
              @change="handleStatusChange(scope.row)" />
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

      <el-pagination layout="prev, pager, next" :total="50" style="margin-top: 20px; justify-content: flex-end" />
    </div>
  </div>
</template>

<style lang="scss"></style>