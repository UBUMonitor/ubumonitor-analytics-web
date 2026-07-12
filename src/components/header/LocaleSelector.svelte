<script lang="ts">
  import { getLocale, type Locale, locales, setLocale } from "@/paraglide/runtime.js"

  const handleChange = (event: Event) => {
    const select = event.currentTarget as HTMLSelectElement
    const locale = select.value as Locale
    setLocale(locale)
  }

  function displayLanguage(tag: string) {
    return new Intl.DisplayNames([tag], { type: "language" }).of(tag)
  }
</script>

<select class="select w-fit appearance-none select-sm" onchange={handleChange} value={getLocale()}>
  {#each locales as locale (locale)}
    <option value={locale}>{displayLanguage(locale)}</option>
  {/each}
</select>
