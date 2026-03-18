<?php

namespace Noin\FilamentFormsTinyeditor\Concerns;

use Livewire\Attributes\Renderless;

trait HasTinyEditor
{
    #[Renderless]
    public function getMentionSourceResults(string $statePath, string $search): array
    {
        foreach ($this->getCachedForms() as $form) {
            if ($results = $form->getMentionSourceResults($statePath, $search)) {
                return $results;
            }
        }

        return [];
    }

    #[Renderless]
    public function afterMentionSelected(string $statePath, $data): void
    {
        foreach ($this->getCachedForms() as $form) {
            $form->afterMentionSelected($statePath, $data);
        }
    }
}
