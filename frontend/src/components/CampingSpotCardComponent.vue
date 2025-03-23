<template>
    <router-link :to="`/camper/${spot.camping_spot_id}`" class="block">
        <div class="w-full h-full rounded-xl shadow-md bg-white overflow-hidden 
             transition duration-300 transform hover:shadow-lg hover:scale-[1.02] cursor-pointer">
            <!-- Only show image if it exists -->
            <img
                v-if="spot.images && spot.images.length > 0"
                :src="spot.images[0].image_url"
                alt="Camping spot image"
                class="w-full h-48 object-cover"
            />
    
            <div class="p-4">
                <h3 class="text-lg font-semibold custom-color">{{ spot.title }}</h3>
                <p class="text-sm custom-color">
                    {{ spot.locations?.city }}, {{ spot.locations?.country?.name }}
                </p>
                <p class="text-sm mt-2 custom-color">{{ spot.description }}</p>
                <p class="font-bold mt-2 custom-color">€{{ spot.price_per_night }} / night</p>
            </div>
        </div>
    </router-link>
</template>

<script setup>
defineProps({
    spot: Object
})
</script>

<style>
.custom-color {
    color: #070600;
}
</style>
