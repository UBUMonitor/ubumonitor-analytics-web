<script lang="ts">
  import { getLocale, type Locale, locales, setLocale } from "@/shared/paraglide/runtime.js"
  import type { ClassValue } from "svelte/elements"

  interface Props {
    class: ClassValue
  }

  const props: Props = $props()

  function displayLanguage(tag: string) {
    return new Intl.DisplayNames([tag], { type: "language" }).of(tag)
  }
</script>

<select
  class={["select w-fit appearance-none select-sm", props.class]}
  name="lang"
  onchange={(event) => setLocale(event.currentTarget.value as Locale)}
  value={getLocale()}
>
  {#each locales as locale (locale)}
    <option value={locale}>{displayLanguage(locale)}</option>
  {/each}
</select>
