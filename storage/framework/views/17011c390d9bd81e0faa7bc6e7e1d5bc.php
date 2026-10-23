<?php if($parameters->isNotEmpty()): ?>
<?php echo $args; ?><?php echo when($parameters->every->optional, '?'); ?>: {
    <?php $__currentLoopData = $parameters; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $parameter): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php echo e($parameter->name); ?><?php echo when($parameter->optional, '?'); ?>: <?php echo $parameter->types; ?>

        <?php if($parameter->key): ?>
            | { <?php echo $parameter->key; ?>: <?php echo $parameter->types; ?> }
        <?php endif; ?>,
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
}

| [
    <?php $__currentLoopData = $parameters; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $parameter): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php echo e($parameter->safeName()); ?>: <?php echo $parameter->types; ?>

        <?php if($parameter->key): ?>
            | { <?php echo $parameter->key; ?>: <?php echo $parameter->types; ?> }
         <?php endif; ?>
        <?php echo when(!$loop->last, ', '); ?>

    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
]

<?php if($parameters->count() === 1): ?> | <?php echo $parameters->first()->types; ?>

    <?php if($parameters->first()->key): ?> | { <?php echo $parameters->first()->key; ?>: <?php echo $parameters->first()->types; ?> }<?php endif; ?>
<?php endif; ?>
,
<?php endif; ?>
<?php echo $options; ?>?: RouteQueryOptions
<?php /**PATH /private/tmp/claude-501/-Users-zadkielt-Herd-unilyzer/d8c94b0e-bcc4-4357-adc8-f6cab887dc98/scratchpad/hc/vendor/laravel/wayfinder/src/../resources/function-arguments.blade.ts ENDPATH**/ ?>