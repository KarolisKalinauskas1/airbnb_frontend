<template>
    <nav class="@container h-25">
        <div class="flex items-center justify-between h-full p-5">
            <div>
                <RouterLink to="/" class="">
                    <img src="../assets/logoForAirbnb.svg" alt="Logo" class="md:w-20 md:h-20 w-14 h-14">
                </RouterLink>
                
            </div>
            <div class="">
                <div class="flex space-x-4">
                    <RouterLink to="/" 
                        class="p-4 hover:scale-110 hover:text-red-400 md:text-[20px]" 
                        active-class="text-red-400 font-bold"
                    >
                        Home
                    </RouterLink>
                    <RouterLink to="campers" 
                        class=" p-4 hover:scale-110 hover:text-red-400 md:text-[20px]" 
                        active-class="text-red-400 font-bold"
                    >
                        Campers
                    </RouterLink>
                    <RouterLink to="/account" 
                        class=" p-4 hover:scale-110 hover:text-red-400 md:text-[20px]" 
                        active-class="text-red-400 font-bold"
                    >
                        Account
                    </RouterLink>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>

    import { RouterLink, RouterView } from 'vue-router'

</script>