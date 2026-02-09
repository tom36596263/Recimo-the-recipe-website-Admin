<script setup>
import { ref } from 'vue';
import IngredientSearchModal from './modals/IngredientSearchModal.vue';

const props = defineProps({
    ingredients: { type: Array, required: true },
    isEditing: { type: Boolean, default: false }
});
const emit = defineEmits(['update:ingredients']);
const updateIngredient = (index, field, value) => {
    const newIngredients = [...props.ingredients];
    newIngredients[index][field] = value;
    emit('update:ingredients', newIngredients);
};
const showSearchModal = ref(false);

const openSearchModal = () => {
    showSearchModal.value = true;
};

const validateAmount = (item) => {
    if (/[^\d.]/.test(item.amount)) {
        item.isInvalid = true;
        setTimeout(() => { item.isInvalid = false; }, 1500);
    }
    let val = item.amount.replace(/[^\d.]/g, "");
    const dotCount = (val.match(/\./g) || []).length;
    if (dotCount > 1) {
        val = val.slice(0, val.lastIndexOf(".")); 
    }
    item.amount = val;
};
const handleAmountChange = (index, value) => {
    const newIngredients = [...props.ingredients];
    let val = value.replace(/[^\d.]/g, ""); // 移除非數字
    
    // 處理多個點的情況
    const dotCount = (val.match(/\./g) || []).length;
    if (dotCount > 1) {
        val = val.slice(0, val.lastIndexOf("."));
    }

    // 更新陣列中該項目的值
    newIngredients[index].amount = val;
    
    // 統一發送 emit 給父組件
    emit('update:ingredients', newIngredients);
};
const handleAddMultiple = (items) => {
    const newIngredients = [...props.ingredients];
    items.forEach(item => {
        const isDuplicate = newIngredients.some(ing => ing.name === item.ingredient_name);
        // const isDuplicate = props.ingredients.some(ing => ing.name === item.ingredient_name);
        if (!isDuplicate) {
            newIngredients.push({
                id: item.ingredient_id,
                name: item.ingredient_name,
                amount: '',
                unit: item.unit_name || '',
                note: '',
                fromDB: true,
                isInvalid: false,
                kcal_per_100g: item.kcal_per_100g || 0,
                protein_per_100g: item.protein_per_100g || 0,
                fat_per_100g: item.fat_per_100g || 0,
                carbs_per_100g: item.carbs_per_100g || 0
            });
        }
        
    });
    emit('update:ingredients', newIngredients);
};
const removeItem = (id) => {
    // 過濾掉被刪除的項目，並通知父組件更新
    const newIngredients = props.ingredients.filter(i => i.id !== id);
    emit('update:ingredients', newIngredients);
};
// const removeItem = (id) => {
//     const index = props.ingredients.findIndex(i => i.id === id);
//     if (index !== -1) props.ingredients.splice(index, 1);
// };
</script>

<template>
    <section class="ingredient-editor-container">
        <div class="section-header">
            <h2 class="header-title zh-h4-bold">食材列表</h2>
        </div>

        <div class="ingredient-list">
            <div v-for="(ing, index) in ingredients" :key="ing.id" class="ingredient-item" :class="{ 'is-view': !isEditing }">
                <button v-if="isEditing" class="remove-btn" @click="removeItem(ing.id)">✕</button>

                <div class="input-row main-row">
                    <input v-model="ing.name" type="text" class="custom-input name-field p-p1" placeholder="食材名稱"
                        :readonly="!isEditing || ing.fromDB"
                        @input="updateIngredient(index, 'name', $event.target.value)" />
                </div>

                <div class="input-row split-row">
                    <div class="amount-group p-p3">
                        <div class="amount-input-wrapper">
                            <input :value="ing.amount" type="text" inputmode="decimal"
                                class="custom-input amount-field p-p3" :class="{ 'error-shake': ing.isInvalid }"
                                placeholder="分量" :readonly="!isEditing" 
                                @input="(e) => {
                                    handleAmountChange(index, e.target.value);
                                    }" />
                            <span v-if="ing.isInvalid" class="number-hint">僅限數字</span>
                        </div>

                        <div class="unit-box">
                            <span class="label">單位：</span>
                            <input v-model="ing.unit" type="text" class="custom-input unit-field p-p2" placeholder="顆"
                                readonly tabindex="-1" />
                        </div>
                    </div>
                </div>

                <div class="input-row note-row">
                    <textarea v-model="ing.note" class="custom-input note-field p-p3" placeholder="新增備註 (限30字)..."
                        :readonly="!isEditing" maxlength="30" rows="2"
                        @input="updateIngredient(index, 'note', $event.target.value)"></textarea>
                </div>
            </div>
        </div>

        <div v-if="isEditing" class="add-action-wrapper">
            <button class="add-ingredient-btn p-p2" @click="openSearchModal">+ 新增食材</button>
        </div>

        <IngredientSearchModal v-model="showSearchModal" :selectedList="ingredients"
            @add-multiple="handleAddMultiple" />
    </section>
</template>

<style lang="scss" scoped>

.ingredient-editor-container {
    width: 100%;
    margin-bottom: 30px;
}

.section-header {
    margin-bottom: 24px;

    .header-title {
        color: $primary-color-800;
        padding-bottom: 12px;
        border-bottom: 1.5px solid $primary-color-400;
        margin: 0;
    }
}

.ingredient-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.name-field {
    pointer-events: none;
}

.ingredient-item {
    position: relative;
    background: $neutral-color-white;
    border: 1px solid $neutral-color-400;
    border-radius: 12px;
    padding: 10px 20px 10px 30px;
    transition: all 0.3s ease;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        background: $primary-color-700;
        opacity: 0.7;
        z-index: 1;
    }

    &.tag-green {
        border-color: #74D09C;
        background: rgba(116, 208, 156, 0.05);

        &::before {
            background: #74D09C;
            opacity: 1;
        }
    }

    &.tag-orange {
        border-color: #FFCB82;
        background: rgba(255, 203, 130, 0.05);

        &::before {
            background: #FFCB82;
            opacity: 1;
        }
    }

    &.tag-blue {
        border-color: #90C6FF;
        background: rgba(144, 198, 255, 0.05);

        &::before {
            background: #90C6FF;
            opacity: 1;
        }
    }

    &:hover {
        border-color: $primary-color-700;
    }

    &.is-view {
        background: $primary-color-100;
        border-color: transparent;

        &::before {
            background: $neutral-color-400;
        }
    }

    .remove-btn {
        position: absolute;
        top: 10px;
        right: 12px;
        background: none;
        border: none;
        color: $secondary-color-danger-400;
        cursor: pointer;
        z-index: 5;
        font-size: 18px;

        &:hover {
            color: $secondary-color-danger-700;
        }
    }
}

.input-row {
    border-bottom: 1px solid $neutral-color-100;
    padding: 6px 0;
    display: flex;
    align-items: center;

    &:last-child {
        border-bottom: none;
    }

    .custom-input {
        border: none;
        outline: none;
        background: transparent;
        color: $neutral-color-800;
        width: 100%;
        padding: 4px 0;

        &::placeholder {
            color: $neutral-color-400;
        }

        &:read-only {
            color: $neutral-color-black;
            cursor: default;
            pointer-events: none; // 讓 readonly 無法點擊
        }
    }
}

.note-row {
    align-items: flex-start;
    padding-top: 8px;

    .note-field {
        color: $neutral-color-700 !important;
        resize: none;
        height: 52px;
        line-height: 1.4;
        font-family: inherit;
        overflow: hidden;
        word-break: break-all;
    }
}

.amount-group {
    display: flex;
    align-items: center;
    width: 100%;

    .amount-input-wrapper {
        flex: 1;
        position: relative;

        .amount-field {
            border-bottom: 1px solid transparent;

            &:focus {
                border-bottom-color: $primary-color-400;
            }
        }

        .number-hint {
            position: absolute;
            left: 0;
            bottom: -12px;
            font-size: 10px;
            color: $secondary-color-danger-400;
            pointer-events: none;
        }
    }

    .unit-box {
        display: flex;
        align-items: center;
        white-space: nowrap;
        color: $neutral-color-700;
        margin-left: 12px;

        .unit-field {
            width: 50px;
            text-align: left;
            border-bottom: 1px dashed $neutral-color-100;

            &:read-only {
                border-bottom: none !important;
            }
        }
    }
}

.error-shake {
    color: $secondary-color-danger-400 !important;
    animation: shake 0.4s ease-in-out;
}

@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-4px);
    }

    75% {
        transform: translateX(4px);
    }
}

.add-action-wrapper {
    margin-top: 20px;

    .add-ingredient-btn {
        width: 100%;
        height: 44px;
        background: $neutral-color-white;
        border: 1.5px solid $primary-color-400;
        border-radius: 10px;
        color: $primary-color-800;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: $primary-color-100;
            transform: translateY(-1px);
        }
    }
}
</style>