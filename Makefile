.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@printf "@alexeyco/pi-revdiff — make targets:\n"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[1m%-10s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: fmt
fmt: ## Format sources (prettier)
	@npx --yes prettier@3 --write .

.PHONY: check
check: node_modules ## Run typecheck and tests (same as CI)
	@npm run typecheck --silent
	@npm test --silent

node_modules: package.json package-lock.json
	@npm ci --silent
	@touch node_modules
